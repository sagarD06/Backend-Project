import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router();

/***************************** REGISTER ROUTE ****************************/
router.route("/register").post(
  // using middleware to handle files
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  // Controller call
  registerUser
);

/***************************** LOGIN ROUTE ****************************/
router.route("/login").post(loginUser);

// Secured Routes
/***************************** GET CURRENT USER ROUTE ****************************/
router.route("/current-user").get(verifyJwtToken, getCurrentUser);

/***************************** LOGOUT ROUTE ****************************/
router.route("/logout").post(verifyJwtToken, logoutUser);

/***************************** REFRESH ACCESS ROUTE ****************************/
router.route("/refresh-token").post(refreshAccessToken);

/***************************** RESET PASSWORD ROUTE ****************************/
router.route("/reset-password").post(verifyJwtToken, changeCurrentPassword);

/***************************** UPDATE USER DETAILS ROUTE ****************************/
router.route("/update-user").patch(verifyJwtToken, updateCurrentUser);

/***************************** UPDATE AVATAR ROUTE ****************************/
router
  .route("/update-avatar")
  .patch(verifyJwtToken, upload.single("avatar"), updateUserAvatar);

/***************************** UPDATE COVER IMAGE ROUTE ****************************/
router
  .route("/update-cover-image")
  .patch(verifyJwtToken, upload.single("coverImage"), updateUserCoverImage);

export default router;
