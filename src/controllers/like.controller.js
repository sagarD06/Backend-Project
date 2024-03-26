import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

/***************************** TOGGLE LIKE ON VIDEO ****************************/

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
  if (!user) throw new ApiError(400, "Invalid Request!");

  const alreadyLiked = await Like.findOne({
    likedBy: user?._id,
    video: videoId,
  });

  if (alreadyLiked) {
    // User has already liked the video so we remove their like
    await Like.deleteOne(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like has been removed successfully!"));
  } else {
    // Create a new like for the user and the video
    const newLike = await Like.create({
      video: videoId,
      likedBy: user._id,
    });

    if (!newLike)
      throw new ApiError(500, "Something went wrong while creating like!");

    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "New like has been created!"));
  }
});

/***************************** TOGGLE LIKE ON A COMMENT ****************************/

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment Id");
  if (!user) throw new ApiError(400, "Invalid Request!");

  const alreadyLiked = await Like.findOne({
    likedBy: user?._id,
    comment: commentId,
  });

  if (alreadyLiked) {
    await Like.deleteOne(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like has been removed successfully!"));
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: user._id,
    });

    if (!newLike)
      throw new ApiError(500, "Something went wrong while creating like!");

    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "New like has been created!"));
  }
});

/***************************** TOGGLE LIKE ON A TWEET ****************************/

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet Id");
  if (!user) throw new ApiError(400, "Invalid Request!");

  const alreadyLiked = await Like.findOne({
    likedBy: user?._id,
    tweet: tweetId,
  });

  if (alreadyLiked) {
    await Like.deleteOne(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like has been removed successfully!"));
  } else {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: user._id,
    });

    if (!newLike)
      throw new ApiError(500, "Something went wrong while creating like!");

    return res
      .status(200)
      .json(new ApiResponse(200, newLike, "New like has been created!"));
  }
});

/***************************** GET ALL LIKED VIDEOS ****************************/

const getLikedVideos = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) throw new ApiError(400, "Invalid request!");

  const likedVideos = await Like.find({
    likedBy: user?._id,
    video: { $exists: true },
  }).select("-comment -tweet");

  if (!likedVideos) throw new ApiError(404, "No videos found!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfuly")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
