import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

/***************************** CREATE PLAYLIST ****************************/

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req.user;
  if (!name || !description)
    throw new ApiError(400, "name and discription are required!");
  if (!user) throw new ApiError(401, "Invalid request, Please Login!");

  const playlist = await Playlist.create({
    name,
    description,
    owner: user?._id,
  });
  if (!playlist)
    throw new ApiError(
      500,
      "Something went wrong while creating the playlist!"
    );

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Plalist created successfully!"));
});

/***************************** GET USER'S PLAYLIST ****************************/

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId))
    throw new ApiError(400, "Invalid User ID");

  const usersPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: {
        updatedAt: -1, // sort by date in descending order
      },
    },
  ]);

  if (!usersPlaylist)
    throw new ApiError(404, "Playlist for the selected user do not exist!");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        usersPlaylist,
        "Users Playlist fetched successfully!"
      )
    );
});

/***************************** GET PLAYLIST BY ID ****************************/

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const user = req.user;
  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Playlist Id!");
  if (!user) throw new ApiError(400, "Invalid request, Please Login!");

  const playlist = await Playlist.findById({ _id: playlistId });

  if (!playlist) throw new ApiError(404, "Playlist does not exists!");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully!"));
});

/***************************** ADD VIDEO TO PLAYLIST ****************************/

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const user = req.user;

  if (
    !playlistId ||
    !isValidObjectId(playlistId) ||
    !videoId ||
    !isValidObjectId(videoId)
  ) {
    throw new ApiError(400, "Invalid data provided!");
  }
  if (!user) throw new ApiError(401, "Ivalid request, Please Login!");

  const playlist = await Playlist.findById({ _id: playlistId });
  if (!playlist) throw new ApiError(404, "Playlist not found!");
  if (playlist.owner.toString() !== user?._id.toString())
    throw new ApiError(401, "Unauthorised request!");

  const updatedPlaylist = await Playlist.updateOne(
    { _id: playlistId },
    { $push: { videos: videoId } }
  );
  if (!updatedPlaylist)
    throw new ApiError(500, "Something went wrong while adding the video!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully!")
    );
});

/***************************** REMOVE VIDEO FROM PLAYLIST ****************************/

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const user = req.user;

  if (
    !playlistId ||
    !isValidObjectId(playlistId) ||
    !videoId ||
    !isValidObjectId(videoId)
  )
    throw new ApiError(400, "Invalid ID Provided!");
  if (!user) throw new ApiError(401, "Imvalid request, Please login!");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist Not Found!");

  if (playlist.owner.toString() !== user?._id.toString())
    throw new ApiError(401, "Unauthoised request!");

  const updatedPlayist = await Playlist.updateOne(
    { _id: playlistId },
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlayist)
    throw new ApiError(
      500,
      "Something went wrong while removing video from playlist!"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlayist, "Video removed from the playlist!")
    );
});

/***************************** DELETE PLAYLIST ****************************/

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const user = req.user;

  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid data provided");

  if (!user) throw new ApiError(401, "Invalid request, Please Login!");

  const playlist = await Playlist.findById({ _id: playlistId });
  if (!playlist) throw new ApiError(404, "Playlist not found!");
  if (playlist.owner.toString() !== user?._id.toString())
    throw new ApiError(401, "Unauthorised request!");

  const deletedPlaylist = await Playlist.findByIdAndDelete({ _id: playlistId });
  if (!deletedPlaylist)
    throw new ApiError(
      500,
      "Something went wrong while deleting the playlist!"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedPlaylist,
        "Playlist has been deleted Successfully!"
      )
    );
});

/***************************** UPDATE PLAYLIST ****************************/

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const user = req.user;

  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Data Provided!");
  if (!name || !description)
    throw new ApiError(400, "Name and Description fields are required!");
  if (!user) throw new ApiError(401, "Invalid request, PLase Login!");

  const playlist = await Playlist.findById({ _id: playlistId });
  if (!playlist) throw new ApiError(404, "Playlist not found!");
  if (playlist.owner.toString() !== user?._id.toString())
    throw new ApiError(401, "Unauthorised request!");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { name, description },
    { new: true }
  );
  if (!updatedPlaylist)
    throw new ApiError(500, "Something went wrong whie updating playlist!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Succesfully!")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
