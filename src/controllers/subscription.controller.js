import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    // Check if channel exists
    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    // Don't allow subscribing to yourself
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    // Already subscribed → unsubscribe
    if (existingSubscription) {

        await Subscription.findByIdAndDelete(existingSubscription._id)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "channel unsubscribed successfully"
                )
            )
    }

    // Not subscribed → subscribe
    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    if (!subscription) {
        throw new ApiError(
            500,
            "something went wrong while subscribing"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "channel subscribed successfully"
            )
        )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    // Check if channel exists
    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribers = await Subscription.find({
        channel: channelId
    })
        .populate(
            "subscriber",
            "username fullname avatar"
        )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "channel subscribers fetched successfully"
            )
        )
})

// controller to return channel list to which user has subscribed
const getChannelsSubbedByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    // Check if subscriber exists
    const subscriber = await User.findById(userId)

    if (!subscriber) {
        throw new ApiError(404, "User not found")
    }

    const subscribedChannels = await Subscription.find({
        subscriber: userId
    })
        .populate(
            "channel",
            "username fullname avatar"
        )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "subscribed channels fetched successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getChannelsSubbedByUser
}