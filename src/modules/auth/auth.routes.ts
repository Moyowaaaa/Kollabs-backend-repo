import express, { Router } from "express";
import {
  changePassword,
  checkEmail,
  forgotPassword,
  loginUser,
  logoutUser,
  resendVerificationEmail,
  resetPassword,
  signUpUser,
  verifyEmail,
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
router.post("/check-email", checkEmail);

// Email verification routes
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export default router;
