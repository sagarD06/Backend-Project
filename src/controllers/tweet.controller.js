import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { content } = req.body;

  if (!user) throw new ApiError(400, "Invalid request!");

  if (!content) throw new ApiError(400, "Content is required!");

  const createdTweet = await Tweet.create({
    owner: user._id,
    content,
  });

  if (!createdTweet)
    throw new ApiError(500, "Something went wrong while creating Tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet, "Tweet created  successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "Invalid Request, Please login!");

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "tweetedBy",
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!tweets?.length) throw new ApiError(404, "No Tweets found");

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!user) throw new ApiError(400, "Invalid Request, Please login!");
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetID!");
  if (!content) throw new ApiError(400, "Content is required!");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not Found!");

  if (tweet.owner.toString() !== user._id.toString())
    throw new ApiError(
      403,
      "You do not have permission to perform this action!"
    );

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweet?._id,
    {
      $set: { content },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet)
    throw new ApiError(500, "Something went wrong while updating the Tweet!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTweet, "Tweet has been Updated Successfully!")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const user = req.user;
  const { tweetId } = req.params;

  if (!user) throw new ApiError(400, "Invalid Request, Please login!");
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid TweetID!");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not Found!");

  if (tweet.owner.toString() !== user._id.toString())
    throw new ApiError(
      403,
      "You do not have permission to perform this action!"
    );

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  console.log(deletedTweet);

  if (!deletedTweet)
    throw new ApiError(500, "Something went wrong while eleting the tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted  successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
