import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, cloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query


    const matchStage = {
        isPublished: true
    }


    // Search videos by title or description
    if (query?.trim()) {
        matchStage.$or = [
            {
                title: {
                    $regex: query.trim(),
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query.trim(),
                    $options: "i"
                }
            }
        ]
    }


    // Get videos uploaded by a particular user
    if (userId) {

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId")
        }

        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }


    const sortOrder = sortType === "asc" ? 1 : -1


    const pipeline = [

        {
            $match: matchStage
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },

        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,

                owner: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        },

        {
            $sort: {
                [sortBy]: sortOrder
            }
        }

    ]


    const options = {
        page: Number(page),
        limit: Number(limit)
    }


    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    )


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "videos fetched successfully"
            )
        )
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)

    if (!video?.url) {
        throw new ApiError(400, "error while uploading video")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail?.url) {
        throw new ApiError(400, "error while uploading thumbnail")
    }

    const createdVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        videoPublicId: video.public_id,
        thumbnail: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id,
        duration: video.duration,
        owner: req.user._id
    })

    if (!createdVideo) {
        throw new ApiError(500, "something went wrong while publishing video")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdVideo,
                "video published successfully"
            )
        )
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
        .populate(
            "owner",
            "username fullname avatar"
        )

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    // If video is unpublished, only the owner can view it
    if (
        !video.isPublished &&
        video.owner._id.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(404, "video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "video fetched successfully"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to update this video")
    }

    const thumbnailLocalPath = req.file?.path

    let thumbnailUrl = video.thumbnail
    let thumbnailPublicId = video.thumbnailPublicId

    if (thumbnailLocalPath) {

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnail?.url) {
            throw new ApiError(400, "error while uploading thumbnail")
        }

        // Delete old thumbnail from Cloudinary
        await cloudinary.uploader.destroy(
            video.thumbnailPublicId
        )

        thumbnailUrl = thumbnail.url
        thumbnailPublicId = thumbnail.public_id
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && { title }),
                ...(description && { description }),
                thumbnail: thumbnailUrl,
                thumbnailPublicId: thumbnailPublicId
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "video updated successfully"
            )
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to delete this video")
    }

    // Delete video from Cloudinary
    await cloudinary.uploader.destroy(video.videoPublicId, {
        resource_type: "video"
    })

    // Delete thumbnail from Cloudinary
    await cloudinary.uploader.destroy(video.thumbnailPublicId)

    // Delete video document from MongoDB
    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "video deleted successfully"
            )
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to modify this video")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                `video ${video.isPublished ? "published" : "unpublished"} successfully`
            )
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
