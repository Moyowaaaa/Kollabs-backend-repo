import express from "express";
import type { Router, RequestHandler } from "express";
import {
  createProject,
  deleteProject,
  getUsersProjects,
  updateProject,
} from "./projects.controller";
import { multipleImageUpload } from "../../utils/multer";

const router = express.Router() as Router;

// POST /v1/api/projects - Create a new project with optional media uploads
router.post("/", multipleImageUpload, createProject as RequestHandler);

// GET /v1/api/projects - Get users projects
router.get("/", getUsersProjects as RequestHandler);

// PUT /v1/api/projects/:projectId - Update a project
router.put("/:projectId", multipleImageUpload, updateProject as RequestHandler);

// DELETE /v1/api/projects/:projectId - Delete a project and its media
router.delete("/:projectId", deleteProject as RequestHandler);

export default router;
