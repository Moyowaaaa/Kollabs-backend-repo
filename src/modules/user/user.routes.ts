import express from "express";
import type { Router, RequestHandler } from "express";
import { getMe, getUser, updateProfile } from "./user.controller";
import { imageAndCvUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

// All user routes require authentication
router.use(verifyAuthentication as express.RequestHandler);

// Get current authenticated user with profile
router.get("/me", getMe as RequestHandler);

// Update user profile
router.patch("/me", imageAndCvUpload, updateProfile as RequestHandler);

// Get user by id
router.get("/:id", getUser as RequestHandler);

export default router;
