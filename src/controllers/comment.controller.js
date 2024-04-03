import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

/***************************** GET ALL COMMENTS ****************************/

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const user = req.user;
  if (!user) throw new ApiError(401, "Invalid request, Please login!");

  let pipeline = [];

  if (videoId && isValidObjectId(videoId)) {
    pipeline.push({ $match: { video: new mongoose.Types.ObjectId(videoId) } });
  } else {
    throw new ApiError(400, "Invalid video Id!");
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  let options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const comments = await Comment.aggregatePaginate(pipeline, options);
  if (!comments) throw new ApiError(404, "no comments found!");

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "All comments fetched successfully!"));
});

/***************************** CREATE COMMENT ****************************/

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;
  const { content } = req.body;

  if (!videoId) throw new ApiError(400, "Video Id required!");
  if (!user) throw new ApiError(400, "Invalid request, Please login!");
  if (!content) throw new ApiError(400, "Content field is required!");

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: user?._id,
  });

  if (!newComment)
    throw new ApiError(500, "Something went wrong while creating comment!");

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment created successfully!"));
});

/***************************** UPDATE COMMENT ****************************/

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;
  const { content } = req.body;

  if (!commentId) throw new ApiError(400, "Comment Id is required!");
  if (!user) throw new ApiError(400, "Invalid request!");
  if (!content) throw new ApiError(400, "Content field is required!");

  const comment = await Comment.findById(commentId);

  if (!comment) throw new ApiError(404, "comment donot exist!");

  if (user?._id.toString() !== comment.owner.toString())
    throw new ApiError(400, "Not authorised to perform this action!");

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    {
      new: true,
    }
  );

  if (!updatedComment)
    throw new ApiError(500, "Soething went wrong while updating the comment!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment Updated Successfully!")
    );
});

/***************************** DELETE COMMENT ****************************/

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user;

  if (!commentId) throw new ApiError(400, "Comment Id is required!");
  if (!user) throw new ApiError(400, "Invalid request!");

  const comment = await Comment.findById(commentId);

  if (!comment) throw new ApiError(404, "comment donot exist!");

  if (user?._id.toString() !== comment.owner.toString())
    throw new ApiError(400, "Not authorised to perform this action!");

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment)
    throw new ApiError(500, "Soething went wrong while updating the comment!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedComment, "Comment Deleted Successfully!")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
