import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utilities/cloudinary.js";

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
  const existingUser = User.findOne({
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
    username,
    email,
    fullName,
    avatar: avatarUrl.url,
    coverImage: coverImageUrl?.url || "",
    password,
    refreshToken,
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

export default registerUser;
