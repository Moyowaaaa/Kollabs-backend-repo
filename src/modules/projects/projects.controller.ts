import type { NextFunction, Request, Response } from "express";
import { ICreateProject } from "./projects.interface";
import { IError } from "../../interfaces/error.interface";
import jwt from "jsonwebtoken";
import { jwtToken } from "../../middleware/authMiddleware";
import ProjectsModel from "./projects.model";
import {
  deleteMultipleFromCloudinary,
  uploadMultipleToCloudinary,
} from "../../utils/cloudinary";

//Create Project
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id } = decoded;

    const { title, description, teamSize } = req.body as ICreateProject;

    // Handle media uploads (optional)
    let media: { url: string; id: string }[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media"
      );
      media = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));
    }

    const project = await ProjectsModel.create({
      title,
      description,
      author: _id,
      media,
      teamSize,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while creating project";
    return next(error);
  }
};

//get user's project
//get users created hero
export const getUsersProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }
  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id } = decoded; // ✅ Get _id, not userId

    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    // Filter heroes by the current user's _id

    const skip = (Number(page) - 1) * Number(limit);
    const projects = await ProjectsModel.find({ author: _id })
      .skip(skip)
      .limit(limit);

    const totalProjects = await ProjectsModel.countDocuments({ author: _id });
    const totalPages = Math.ceil(totalProjects / limit);

    res.status(200).json({
      projects,

      pagination: {
        totalProjects,
        totalPages: Math.ceil(totalPages / Number(limit)),
        currentPage: Number(page),
        itemsPerPage: Number(limit),
      },
    });

    if (!isNaN(limit) && limit > 0) {
      return res.status(200).json(projects.slice(0, limit));
    }
    res.status(200).json(projects);
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while updating project";
    return next(err);
  }
};

//update project
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id } = decoded;

    const { projectId } = req.params;
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (project.author !== _id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { title, description, teamSize } = req.body as ICreateProject;

    // Handle media uploads (optional)
    let media: { url: string; id: string }[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media"
      );
      media = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));
    }

    const updatedProject = await ProjectsModel.findByIdAndUpdate(
      projectId,
      {
        title,
        description,
        teamSize,
        media,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while updating project";
    return next(err);
  }
};

// Delete project
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id } = decoded;

    const { projectId } = req.params;
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (project) {
      await ProjectsModel.deleteOne({ _id: projectId });

      if (project.media && project.media?.length > 0) {
        const deletePromises = project.media.map((media) =>
          deleteMultipleFromCloudinary([media.id])
        );
        await Promise.all(deletePromises);
      }
      res.status(200).json({ message: "Project deleted successfully" });
    }
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while creating project";
    return next(error);
  }
};
