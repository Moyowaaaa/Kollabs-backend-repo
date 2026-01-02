import express, { Router } from "express";
import {
  changePassword,
  forgotPassword,
  loginUser,
  resetPassword,
  signUpUser,
} from "./auth.controller";
import { authLimiter } from "../../middleware/rateLimiter";
import { singleImageUpload } from "../../utils/multer";

const router = express.Router() as Router;

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post("/sign-in", loginUser);
router.post("/sign-up", singleImageUpload, signUpUser);
router.post("/change-password", changePassword);

// Password reset flow
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
