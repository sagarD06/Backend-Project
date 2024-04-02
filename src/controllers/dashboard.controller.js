import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";


/***************************** GET CHANNEL STATS ****************************/

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    if (!user) throw new ApiError(401, "Invalid request, Please login!");

    const totalVideoViews = await Video.aggregate([
      { $match: { owner: user?._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    // Get total subscribers
    const totalSubscribers = await Subscription.countDocuments({
      channel: user?._id,
    });

    // Get total videos
    const totalVideos = await Video.countDocuments({
      owner: user?._id,
    });

    // Get total likes
    const totalLikes = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(user?._id),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
          pipeline: [
            {
              $count: "total",
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          total: "$likes.total",
        },
      },
    ]);

    // Construct the response object
    const channelStats = {
      totalVideoViews: totalVideoViews.length
        ? totalVideoViews[0].totalViews
        : 0,
      totalSubscribers,
      totalVideos,
      totalLikes:totalLikes.length,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelStats,
          "Channel stats fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Something went wromg while fetching stats!");
  }
});


/***************************** GET ALL VIDEOS UPLOADED BY CHANNEL ****************************/

const getChannelVideos = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(401, "Invalid request, Please login!");

  const videos = await Video.find({ owner: user?.id });

  if (!videos?.length) throw new ApiError(404, "No Videos found!");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos Fetched Successfully"));
});

export { getChannelStats, getChannelVideos };
