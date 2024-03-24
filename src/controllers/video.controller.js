import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFileFromCloudinary,
} from "../utilities/cloudinary.js";

/***************************** GET ALL VIDEOS ****************************/

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

/***************************** UPLOAD VIDEO TO DB ****************************/

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const user = req.user;

  if (!title || !description)
    throw new ApiError(400, "Please provide a valid title and description!");
  if (!user)
    throw new ApiError(403, "You must be logged in to perform this action");

  const videoPath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!videoPath || !thumbnailPath)
    throw new ApiError(422, "Missing file data");

  const video = await uploadOnCloudinary(videoPath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!video || !thumbnail)
    throw new ApiError(
      500,
      "Something went wrong while uploading video on Cloudinary!"
    );

  const uploadedVideo = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    owner: new mongoose.Types.ObjectId(user?._id),
    title,
    description,
    duration: video?.duration,
  });

  if (!uploadedVideo)
    throw new ApiError(500, "Something went wrong while uploading the video!");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        uploadedVideo,
        "The video has been successfully published!"
      )
    );
});

/***************************** GET VIDEO BY ID**************************/

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!video) throw new ApiError(404, "Video not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully fetched the video!"));
});

/***************************** UPDATE THE VIDEO ****************************/

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;
  const { title, description } = req.body;
  const newThumbnailPath = req.file?.path;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");
  if (!title || !description || !newThumbnailPath)
    throw new ApiError(
      400,
      "Missing fields require title, description, thumbnail!"
    );

  const video = await Video.findById(videoId);
  if (user?._id.toString() !== video.owner.toString())
    throw new ApiError(400, "You are not authorized to perform this action");

  const oldThumbnailUrl = video?.thumbnail;

  const newThumbnail = await uploadOnCloudinary(newThumbnailPath);
  if (!newThumbnail)
    throw new ApiError(
      500,
      "Something went wrong while uploading thumbnail on Cloudinary!"
    );

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail?.url,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo)
    throw new ApiError(500, "Something went wrong while updating the video!");

  // deleting old thumbnail.
  const deletedThumbnail = await deleteFileFromCloudinary(oldThumbnailUrl);
  if (!deletedThumbnail)
    throw new ApiError(
      501,
      "something went wrong while deleting old Thumbnail from cloudinary!"
    );

  console.log(deletedThumbnail);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "The video has been updated successfully!"
      )
    );
});

/***************************** DELETE THE VIDEO ****************************/

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID!");

  const video = await Video.findById(videoId);
  if (user?._id.toString() !== video.owner.toString())
    throw new ApiError(400, "You are not authorized to perform this action");

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!video) throw new ApiError(404, "No video with this id found");
  const deletedVideoCloudinary = await deleteFileFromCloudinary(
    video.videoFile
  );
  if (!deletedVideoCloudinary)
    throw new ApiError(
      501,
      "something went wrong while deleting old Thumbnail from cloudinary!"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video has been deleted"));
});

/***************************** TOGGLE ISPUCBLISHED STATUS ****************************/

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

  if (!video) throw new ApiError(500, "could not update the bit!");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        "publish status of the video has been changed"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
