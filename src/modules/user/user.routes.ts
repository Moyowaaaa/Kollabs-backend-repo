import express from "express";
import type { Router, RequestHandler } from "express";
import { getMe, updateProfile } from "./user.controller";
import { singleImageUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

// All user routes require authentication
router.use(verifyAuthentication as express.RequestHandler);

// Get current user with profile
router.get("/me", getMe as RequestHandler);

// Update profile (with optional new profile picture)
router.patch("/me", singleImageUpload, updateProfile as RequestHandler);

export default router;
