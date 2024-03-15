import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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
/***************************** LOGOUT ROUTE ****************************/
router.route("/logout").post(verifyJwtToken, logoutUser);

export default router;
