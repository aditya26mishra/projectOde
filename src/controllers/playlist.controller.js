import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(
            400,
            "name and description are required"
        )
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(
            500,
            "something went wrong while creating playlist"
        )
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlist,
                "playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const playlists = await Playlist.find({
        owner: userId
    })
        .populate(
            "owner",
            "username fullname avatar"
        )
        .sort({
            createdAt: -1
        })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "user playlists fetched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate(
            "owner",
            "username fullname avatar"
        )   
        .populate({
            path: "videos",
            select: "videoFile thumbnail title description duration views owner",
            populate: {
                path: "owner",
                select: "username fullname avatar"
            }
        })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "playlist fetched successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to modify this playlist"
        )
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.videos.some(
        id => id.toString() === videoId.toString()
    )) {
        throw new ApiError(
            400,
            "Video is already in the playlist"
        )
    }

    playlist.videos.push(videoId)

    await playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "video added to playlist successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to modify this playlist"
        )
    }

    const videoIndex = playlist.videos.findIndex(
        id => id.toString() === videoId.toString()
    )

    if (videoIndex === -1) {
        throw new ApiError(
            404,
            "Video is not in the playlist"
        )
    }

    playlist.videos.splice(videoIndex, 1)

    await playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "video removed from playlist successfully"
            )
        )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this playlist"
        )
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "playlist deleted successfully"
            )
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(
            400,
            "At least name or description is required"
        )
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this playlist"
        )
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                ...(name?.trim() && {
                    name: name.trim()
                }),
                ...(description?.trim() && {
                    description: description.trim()
                })
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
                updatedPlaylist,
                "playlist updated successfully"
            )
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
