import jwt from "jsonwebtoken";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiErrors.js";
import { User } from "../models/user.models.js";


/***************************** CHECKING AND VERIYING TOKEN ****************************/

export const verifyJwtToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorised request!");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken)
      throw new ApiError(401, "provided access token is invalid!");

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    ); // check user exists in the database
    if (!user) throw new ApiError(401, "Inavlid Access token!");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Ivalid access token!");
  }
});
