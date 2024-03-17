import { ApiError } from "./ApiErrors.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteImageFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) throw new ApiError(400, "File url is neccessary!");
    const regex = /\/v\d+\/([^.]+)\.jpg$/;
    const publicIdArray = fileUrl.match(regex);

    if (!publicIdArray)
      throw new ApiError(500, "Something went wrong while fetching PublicId!");

    const publicId = publicIdArray[1];
    console.log("imageId", publicId);

    const response = await cloudinary.uploader.destroy(publicId);
    console.log("Inside delete image", response);

    if (!response) throw new ApiError(500, "Failed to delete the image");

    return true;
  } catch (error) {
    return false;
  }
};

export { deleteImageFromCloudinary };
