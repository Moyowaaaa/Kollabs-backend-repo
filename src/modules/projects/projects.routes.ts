import express from "express";
import type { Router, RequestHandler } from "express";
import {
  archiveProject,
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getUsersProjects,
  patchProject,
  searchProjects,
  updateProject,
} from "./projects.controller";
import { projectMediaUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// POST /v1/api/projects - Create a new project with optional media uploads
router.post("/", projectMediaUpload, createProject as RequestHandler);

// GET /v1/api/projects - Get users projects
router.get("/", getUsersProjects as RequestHandler);

// GET /v1/api/projects/search - Search projects with filters (must be before :projectId)
router.get("/search", searchProjects as RequestHandler);

// /v1/api/projects/project-feed - Get all projects
router.get("/project-feed", getAllProjects as RequestHandler);

// /v1/api/projects/:projectId - Get a single project
router.get("/:projectId", getProjectById as RequestHandler);

// PUT /v1/api/projects/:projectId - Full update (replaces all fields)
router.put("/:projectId", projectMediaUpload, updateProject as RequestHandler);

// PATCH /v1/api/projects/:projectId - Partial update (only updates provided fields)
router.patch("/:projectId", projectMediaUpload, patchProject as RequestHandler);

// PATCH /v1/api/projects/:projectId/archive - Archive a project
router.patch("/:projectId/archive", archiveProject as RequestHandler);

// DELETE /v1/api/projects/:projectId - Delete a project (soft delete)
router.delete("/:projectId", deleteProject as RequestHandler);

export default router;
