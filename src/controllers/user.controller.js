import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import jwt from "jsonwebtoken";
import { deleteImageFromCloudinary } from "../utilities/deleteImageFromCloudinary.js";

/***************************** GLOBAL DECLERATION ****************************/

const options = {
  httpOnly: true,
  secure: true,
};

/***************************** GENERATE ACCESS AND REFRESH TOKEN ****************************/

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // To bypass password validation on save to DB.

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token!"
    );
  }
};

/***************************** REGISTER NEW USER ****************************/

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  console.log(email);

  //  validating if any fields are empty!
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, `${field} cannot be empty!`);
  }

  // Check if user exists in the database already.
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "Username or email id used already exists on the platform!"
    );
  }

  // collecting the file paths from multer.
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required!");
  }

  //   Uploading files to Cloudinary.
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);

  const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError(400, "Avatar image is required!");
  }

  // Create a user obj and inserting to DB.
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatarUrl.url,
    coverImage: coverImageUrl?.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user!");
  }

  // sending the response back.
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User  has been successfully created!")
    );
});

/***************************** LOGING IN THE USER ****************************/

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email)
    throw new ApiError(404, "Username or Email field is required!");

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) throw new ApiError(401, "User does not exist!");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(403, "Incorrect user credentials!");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Logged in Successfully!"
      )
    );
});

/***************************** LOGING OUT THE USER ****************************/

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Remove the tokens from the database
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

/***************************** GET CURRENT USER ****************************/

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully!"));
});

/***************************** UPDATE CURRENT USER ****************************/

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email)
    throw new ApiError(400, "Please provide full name and email!");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated Successfully!"));
});

/***************************** UPDATE CURRENT USER AVATAR ****************************/

const updateUserAvatar = asyncHandler(async (req, res) => {
  const oldFileUrl = req.user?.coverImage;
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) new ApiError(400, "Avatar file is missing!");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) throw new ApiError(400, "Error while uploading avatar!");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  const isDeleted = deleteImageFromCloudinary(oldFileUrl);

  if (!isDeleted)
    throw new ApiError(
      500,
      "Something went wrong while deleting the previous image!"
    );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully!"));
});

/***************************** UPDATE CURRENT USER COVER IMAGE ****************************/

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const oldFileUrl = req.user?.coverImage;
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) new ApiError(400, "Cover image file is missing!");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url)
    throw new ApiError(400, "Error while uploading Cover Image!");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  const isDeleted = deleteImageFromCloudinary(oldFileUrl);

  if (!isDeleted)
    throw new ApiError(500, "Could not delete the previous image!");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully!"));
});

/***************************** REFRESH ACCESS TOKEN ****************************/

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request!");

    const decodedtoken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedtoken) throw new ApiError(401, "Invalid refresh token!");

    const user = await User.findById(decodedtoken?._id);
    if (!user) throw new ApiError(401, "The user does not exist!");

    if (incomingRefreshToken !== user.refreshToken)
      throw new ApiError(401, "Provided refresh token is incorrect!");

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token has been renewed!"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token!");
  }
});

/***************************** RESET CURRENT PASSWORD ****************************/

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (user.password !== oldPassword)
    throw new ApiError(400, "Invalid password!");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false }); // To bypass the validation.

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password successfully changed!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
};
