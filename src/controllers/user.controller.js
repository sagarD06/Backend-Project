import { asyncHandler } from "../utilities/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: `OK` });
});

export default registerUser;
