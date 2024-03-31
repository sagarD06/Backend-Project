import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

/***************************** TOGGLE SUBSCRIBER BUTTON ****************************/

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;

  if (!channelId && !isValidObjectId(channelId))
    throw new ApiError(400, "Missing Channel Id!");
  if (!user)
    throw new ApiError(401, "You must be logged in to perform this action!");

  const isSubscribed = await Subscription.findOne({
    subscriber: user?._id,
    channel: channelId,
  });

  if (!isSubscribed) {
    const newSubscriber = await Subscription.create({
      subscriber: user._id,
      channel: channelId,
    });
    if (!newSubscriber)
      throw new ApiError(500, "Something went wrong while subscribing!");
    return res
      .status(200)
      .json(new ApiResponse(200, newSubscriber, "Successfully Subscribed!"));
  } else {
    const unsubscribed = await Subscription.findByIdAndDelete(isSubscribed._id);
    if (!unsubscribed) throw new ApiError(500, "Failed to Unsubscribe!");
    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribed, "Successfully Unsubscribed!"));
  }
});

/***************************** GET ALL SUBSCRIBERS ****************************/

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;

  if (!channelId && !isValidObjectId(channelId))
    throw new ApiError(400, "Missing Channel Id!");
  if (!user)
    throw new ApiError(401, "You must be logged in to perform this action!");

  const subscriptions = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [{ $project: { _id: 0, fullName: 1 } }],
      },
    },
    {
      $project: {
        _id: 0,
        channel: 1,
        subscribers: "$subscribers.fullName",
      },
    },
  ]);

  if (!subscriptions) throw new ApiError(404, "No User Found In This Channel");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "All subscribers fetched successfully!"
      )
    );
});

/***************************** GET ALL CHANNELS SUBSCRIBED TO ****************************/

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const user = req.user;

  if (!subscriberId && !isValidObjectId(subscriberId))
    throw new ApiError(400, "Missing subscriber Id!");
  if (!user)
    throw new ApiError(401, "You must be logged in to perform this action!");

  const subscribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
        pipeline: [{ $project: { _id: 0, fullName: 1 } }],
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: 1,
        subscribedTo: "$subscribedTo.fullName",
      },
    },
  ]);

  if (!subscribedTo) throw new ApiError(404, "No User Found In This Channel");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedTo,
        "All subscribers fetched successfully!"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
