import express from "express";
import type { Router, RequestHandler } from "express";
import { getMe, updateProfile } from "./user.controller";
import { imageAndCvUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

// All user routes require authentication
router.use(verifyAuthentication as express.RequestHandler);

router.get("/me", getMe as RequestHandler);
router.patch("/me", imageAndCvUpload, updateProfile as RequestHandler);

export default router;
