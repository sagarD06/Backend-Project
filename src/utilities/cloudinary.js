import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiErrors.js";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFileUrl) => {
  try {
    if (!localFileUrl) return null;
    const response = await cloudinary.uploader.upload(localFileUrl, {
      resource_type: "auto",
    });
    // console.log(`file uploaded successfuly, ${response.url}`);
    fs.unlinkSync(localFileUrl);
    return response;
  } catch (error) {
    fs.unlinkSync(localFileUrl); // delete local file after error
    return null;
  }
};

const deleteFileFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) throw new ApiError(400, "File url is neccessary!");
    const regex = /[\w\.\$]+(?=.png|.jpg|.gif|.mp4)/;
    const publicIdArray = fileUrl.match(regex);

    if (!publicIdArray)
      throw new ApiError(500, "Something went wrong while fetching PublicId!");

    const publicId = publicIdArray[0];

    const response = await cloudinary.uploader.destroy(publicId);

    if (!response) throw new ApiError(500, "Failed to delete the image");

    return response;
  } catch (error) {
    return false;
  }
};

export { uploadOnCloudinary, deleteFileFromCloudinary };
