import express from "express";
import type { Router, RequestHandler } from "express";
import {
  createRequest,
  getRequestsForProject,
  getMyRequests,
  getRequestById,
  acceptRequest,
  rejectRequest,
} from "./collaboration-requests.controller";
import { projectMediaUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// POST /v1/api/collaboration-requests/projects/:projectId/requests
router.post(
  "/projects/:projectId/requests",
  projectMediaUpload,
  createRequest as RequestHandler,
);

// GET /v1/api/collaboration-requests/projects/:projectId/requests
router.get(
  "/projects/:projectId/requests",
  getRequestsForProject as RequestHandler,
);

// GET /v1/api/collaboration-requests/my-requests
router.get("/my-requests", getMyRequests as RequestHandler);

// GET /v1/api/collaboration-requests/:requestId
router.get("/:requestId", getRequestById as RequestHandler);

// PATCH /v1/api/collaboration-requests/:requestId/accept
router.patch("/:requestId/accept", acceptRequest as RequestHandler);

// PATCH /v1/api/collaboration-requests/:requestId/reject
router.patch("/:requestId/reject", rejectRequest as RequestHandler);

export default router;
