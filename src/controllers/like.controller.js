import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    // Check if user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    // If like already exists → unlike
    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { liked: false },
                    "video unliked successfully"
                )
            )
    }

    // Otherwise → like the video
    const like = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    if (!like) {
        throw new ApiError(500, "something went wrong while liking video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { liked: true },
                "video liked successfully"
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { liked: false },
                    "comment unliked successfully"
                )
            )
    }

    // Otherwise → like the comment
    const like = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    if (!like) {
        throw new ApiError(500, "something went wrong while liking comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { liked: true },
                "comment liked successfully"
            )
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { liked: false },
                    "tweet unliked successfully"
                )
            )
    }

    // Otherwise → like the tweet
    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (!like) {
        throw new ApiError(500, "something went wrong while liking tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { liked: true },
                "tweet liked successfully"
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                video: { $exists: true }
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },

        {
            $unwind: "$video"
        },

        {
            $match: {
                "video.isPublished": true
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        {
            $unwind: "$owner"
        },

        {
            $project: {
                _id: "$video._id",
                videoFile: "$video.videoFile",
                thumbnail: "$video.thumbnail",
                title: "$video.title",
                description: "$video.description",
                duration: "$video.duration",
                views: "$video.views",
                createdAt: "$video.createdAt",

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullname: "$owner.fullname",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "liked videos fetched successfully"
            )
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}