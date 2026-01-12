import type { NextFunction, Request, Response } from "express";
import { ICreateProject } from "./projects.interface";
import { IError } from "../../interfaces/error.interface";
import jwt from "jsonwebtoken";
import { jwtToken } from "../../middleware/authMiddleware";
import ProjectsModel from "./projects.model";
import { uploadMultipleToCloudinary } from "../../utils/cloudinary";

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
        totalPages,
        currentPage: Number(page),
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while updating project";
    return next(err);
  }
};

//  get all projects
export const getAllProjects = async (
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
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const skip = (Number(page) - 1) * Number(limit);
    const projects = await ProjectsModel.find()
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName profilePhoto");

    const totalProjects = await ProjectsModel.countDocuments();
    const totalPages = Math.ceil(totalProjects / limit);

    res.status(200).json({
      projects,

      pagination: {
        totalProjects,
        totalPages: totalPages,
        currentPage: Number(page),
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching projects";
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

    if (project.author.toString() !== _id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { title, description, teamSize } = req.body as ICreateProject;

    // Handle media uploads - preserve existing media if no new files uploaded
    let media: { url: string; id: string }[] = project.media || [];

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

// Patch project (partial update - only updates provided fields)
export const patchProject = async (
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

    if (project.author.toString() !== _id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (project.status === "deleted") {
      res
        .status(400)
        .json({ message: "Project is deleted and cannot be updated" });
      return;
    }

    // Build update object with only provided fields
    const updateFields: Partial<ICreateProject> = {};
    const body = req.body as Partial<ICreateProject>;

    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined)
      updateFields.description = body.description;
    if (body.teamSize !== undefined) updateFields.teamSize = body.teamSize;

    // Handle media uploads - only update if new files are provided
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media"
      );
      updateFields.media = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));
    }

    const updatedProject = await ProjectsModel.findByIdAndUpdate(
      projectId,
      { $set: updateFields },
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
// export const deleteProject = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { authorization } = req.headers;
//   if (!authorization) {
//     res.status(401).json({ message: "Authorization token required" });
//     return;
//   }

//   try {
//     const token = authorization.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
//     const { _id } = decoded;

//     const { projectId } = req.params;
//     const project = await ProjectsModel.findOne({
//       _id: projectId,
//       author: _id,
//     });
//     if (!project) {
//       res.status(404).json({ message: "Project not found" });
//       return;
//     }

//     if (project) {
//       await ProjectsModel.deleteOne({ _id: projectId });

//       if (project.media && project.media?.length > 0) {
//         const deletePromises = project.media.map((media) =>
//           deleteMultipleFromCloudinary([media.id])
//         );
//         await Promise.all(deletePromises);
//       }
//       res.status(200).json({ message: "Project deleted successfully" });
//     }
//   } catch (err) {
//     const error = err as IError;
//     error.status = 500;
//     error.message = "An error occurred while deleting project";
//     return next(error);
//   }
// };

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
    const project = await ProjectsModel.findOne({
      _id: projectId,
      author: _id,
    });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await ProjectsModel.findByIdAndUpdate(projectId, { status: "deleted" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while deleting project";
    return next(error);
  }
};

//archive project

export const archiveProject = async (
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
    const project = await ProjectsModel.findOne({
      _id: projectId,
      author: _id,
    });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await ProjectsModel.findByIdAndUpdate(projectId, { status: "archived" });

    res.status(200).json({ message: "Project archived successfully" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while archiving project";
    return next(error);
  }
};
