import express, { Router } from "express";
import { changePassword, loginUser, signUpUser } from "./auth.controller";
import { authLimiter } from "../../middleware/rateLimiter";
import { singleImageUpload } from "../../utils/multer";

const router = express.Router() as Router;

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post("/sign-in", loginUser);
router.post("/sign-up", singleImageUpload, signUpUser);
router.post("/reset-password", changePassword);

export default router;
