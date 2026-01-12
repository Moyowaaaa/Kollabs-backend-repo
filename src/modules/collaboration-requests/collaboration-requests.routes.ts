import express from "express";
import type { Router, RequestHandler } from "express";
import {
  createRequest,
  getRequestsForProject,
  getMyRequests,
  acceptRequest,
  rejectRequest,
} from "./collaboration-requests.controller";
import { projectMediaUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// POST /v1/api/projects/:projectId/requests - Submit a collaboration request
router.post(
  "/projects/:projectId/requests",
  projectMediaUpload,
  createRequest as RequestHandler
);

// GET /v1/api/projects/:projectId/requests - Get requests for a project (author only)
router.get(
  "/projects/:projectId/requests",
  getRequestsForProject as RequestHandler
);

// GET /v1/api/collaboration-requests/my-requests - Get user's own sent requests
router.get("/my-requests", getMyRequests as RequestHandler);

// PATCH /v1/api/collaboration-requests/:requestId/accept - Accept a request
router.patch("/:requestId/accept", acceptRequest as RequestHandler);

// PATCH /v1/api/collaboration-requests/:requestId/reject - Reject a request
router.patch("/:requestId/reject", rejectRequest as RequestHandler);

export default router;
