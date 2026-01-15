import express, { Router } from "express";
import {
  changePassword,
  forgotPassword,
  loginUser,
  logoutUser,
  resetPassword,
  signUpUser,
} from "./auth.controller";
import { authLimiter } from "../../middleware/rateLimiter";
import { imageAndCvUpload } from "../../utils/multer";

const router = express.Router() as Router;

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post("/sign-in", loginUser);
router.post("/sign-out", logoutUser);
router.post("/sign-up", imageAndCvUpload, signUpUser);
router.post("/change-password", changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
