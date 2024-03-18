import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully fetched the video!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");
  if (!title || !description || !thumbnail)
    throw new ApiError(
      400,
      "Missing fields require title, description, thumbnail!"
    );

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { title, description, thumbnail },
    },
    {
      new: true,
    }
  );

  if (!video)
    throw new ApiError(500, "omething went wrong while updating the video!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "The video has been updated successfully!")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) throw new ApiError(404, "No video with this id found");
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");

  let video = await Video.findByIdAndUpdate(
    videoId,
    {
      $bit: { isPublished: { xor: 1 } },
    },
    {
      new: true,
    }
  );

  if(!video) throw new ApiError(500, "could not update the bit!");
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
