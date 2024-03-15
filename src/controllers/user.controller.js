import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";
import jwt from "jsonwebtoken";

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
  res
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

  res
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

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
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

    res
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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
