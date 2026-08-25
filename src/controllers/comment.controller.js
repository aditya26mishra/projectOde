import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const pipeline = [

        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
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
            $unwind: "$owner"
        },

        {
            $project: {
                content: 1,
                video: 1,
                createdAt: 1,
                updatedAt: 1,

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullname: "$owner.fullname",
                    avatar: "$owner.avatar"
                }
            }
        },

        {
            $sort: {
                createdAt: -1
            }
        }

    ]

    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "comments fetched successfully"
            )
        )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                comment,
                "comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        )
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
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
                updatedComment,
                "comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        )
    }

    await Comment.findByIdAndDelete(commentId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "comment deleted successfully"
            )
        )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
