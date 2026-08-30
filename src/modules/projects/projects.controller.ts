import type { NextFunction, Response } from "express";
import { ICreateProject, IAuthorPopulated } from "./projects.interface";
import { IError } from "../../interfaces/error.interface";
import { AuthenticatedRequest } from "../auth/auth.interface";
import ProjectsModel from "./projects.model";
import {
  PROJECT_PIPELINE_STATUSES,
  canTransitionProjectStatus,
  normalizeProjectStatus,
} from "./project-status";
import { uploadMultipleToCloudinary } from "../../utils/cloudinary";
import { invalidateFeedCache } from "../feed/feed.controller";
import { Types } from "mongoose";
// Ensure referenced models are registered for populate()
import userAuthModel from "../auth/auth.model";
import "../user/user.model";

function getAuthorId(
  author: Types.ObjectId | IAuthorPopulated | string,
): string {
  if (typeof author === "string") {
    return author;
  }
  if (author instanceof Types.ObjectId) {
    return String(author);
  }
  return String(author._id);
}

function getUserId(userId: string | Types.ObjectId): string {
  return String(userId);
}

function isProjectAuthor(
  author: Types.ObjectId | IAuthorPopulated | string,
  userId: string | Types.ObjectId,
): boolean {
  return getAuthorId(author) === getUserId(userId);
}

function isAuthorPopulated(
  author: unknown,
): author is IAuthorPopulated {
  return (
    typeof author === "object" &&
    author !== null &&
    "_id" in author &&
    "email" in author
  );
}

const populateAuthorUser = async (authorId: string) => {
  return userAuthModel
    .findById(authorId)
    .select("email userProfile")
    .populate({
      path: "userProfile",
      select: "firstname lastname profilePicture roles bio",
    });
};

//Create Project
export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware

    const { title, description, teamSize, requiredRoles } =
      req.body as ICreateProject;

    // Handle media uploads (optional)
    let media: { url: string; id: string }[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media",
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
      requiredRoles: requiredRoles || [],
    });

    // Invalidate feed cache so new project appears immediately
    console.log("🔄 Invalidating feed cache after project creation...");
    await invalidateFeedCache();
    console.log("✅ Feed cache invalidated successfully");

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

// Search projects/ideas with filters
export const searchProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      query,
      status,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as {
      query?: string;
      status?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      status: { $nin: ["deleted", "archived"] },
    };

    // Text search if query provided
    if (query && query.trim()) {
      filter.$text = { $search: query.trim() };
    }

    // Filter by specific status if provided
    if (
      status &&
      (PROJECT_PIPELINE_STATUSES as readonly string[]).includes(
        normalizeProjectStatus(status),
      )
    ) {
      filter.status = normalizeProjectStatus(status);
    }

    // Build sort object
    const sortOptions: Record<string, 1 | -1> = {};

    // If text search, include text score for relevance sorting
    if (query && query.trim()) {
      sortOptions.score = { $meta: "textScore" } as unknown as 1;
    }

    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with population
    const projectsQuery = ProjectsModel.find(
      filter,
      query && query.trim() ? { score: { $meta: "textScore" } } : {},
    )
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "author",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture roles bio",
        },
      })
      .populate({
        path: "collaborators",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture",
        },
      });

    const [projects, totalProjects] = await Promise.all([
      projectsQuery.exec(),
      ProjectsModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProjects / limitNum);

    res.status(200).json({
      projects,
      pagination: {
        totalProjects,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        query: query || null,
        status: status || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while searching projects";
    return next(error);
  }
};

//get user's project (authored + collaborating)
export const getUsersProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware

    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const scope = (req.query.scope as string) || "all";
    // scope: "authored" | "collaborating" | "all"
    const skip = (Number(page) - 1) * Number(limit);

    const notDeleted = { status: { $nin: ["deleted", "archived"] } };
    let filter: Record<string, unknown>;

    if (scope === "authored") {
      filter = { author: _id, ...notDeleted };
    } else if (scope === "collaborating") {
      filter = { collaborators: _id, ...notDeleted };
    } else {
      // all: projects the user owns or collaborates on
      filter = {
        ...notDeleted,
        $or: [{ author: _id }, { collaborators: _id }],
      };
    }

    const [projects, totalProjects] = await Promise.all([
      ProjectsModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "author",
          select: "email userProfile",
          populate: {
            path: "userProfile",
            select: "firstname lastname profilePicture roles bio",
          },
        })
        .populate({
          path: "collaborators",
          select: "email userProfile",
          populate: {
            path: "userProfile",
            select: "firstname lastname profilePicture",
          },
        }),
      ProjectsModel.countDocuments(filter),
    ]);

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
    err.message = "An error occurred while fetching projects";
    return next(err);
  }
};

//  get all projects
export const getAllProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = { status: { $nin: ["deleted", "archived"] } };
    const projects = await ProjectsModel.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName profilePhoto");

    const totalProjects = await ProjectsModel.countDocuments(filter);
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

//single project
export const getProjectById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const project = await ProjectsModel.findOne({
      _id: projectId,
      status: { $nin: ["deleted", "archived"] },
    })
      .populate({
        path: "author",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture roles bio",
        },
      })
      .populate({
        path: "collaborators",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture roles bio",
        },
      });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const projectPayload = project.toObject();

    // Fallback if author populate silently failed (left as ObjectId)
    if (!isAuthorPopulated(projectPayload.author)) {
      const author = await populateAuthorUser(
        getAuthorId(projectPayload.author),
      );
      if (author) {
        projectPayload.author = author.toObject() as IAuthorPopulated;
      }
    }

    res.status(200).json({ project: projectPayload });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching projects";
    return next(err);
  }
};

//update project
export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware

    const { projectId } = req.params;
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (!isProjectAuthor(project.author, _id)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { title, description, teamSize, requiredRoles } =
      req.body as ICreateProject;

    // Handle media uploads - preserve existing media if no new files uploaded
    let media: { url: string; id: string }[] = project.media || [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media",
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
        requiredRoles: requiredRoles || project.requiredRoles || [],
      },
      { new: true },
    );

    // Invalidate feed cache
    console.log("🔄 Invalidating feed cache after project update...");
    await invalidateFeedCache();
    console.log("✅ Feed cache invalidated successfully");

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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware

    const { projectId } = req.params;
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (!isProjectAuthor(project.author, _id)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (project.status === "deleted") {
      res
        .status(404)
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
    if (body.requiredRoles !== undefined)
      updateFields.requiredRoles = body.requiredRoles;

    // Handle media uploads - only update if new files are provided
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "projects_media",
      );
      updateFields.media = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));
    }

    const updatedProject = await ProjectsModel.findByIdAndUpdate(
      projectId,
      { $set: updateFields },
      { new: true },
    );

    // Invalidate feed cache
    console.log("🔄 Invalidating feed cache after project update...");
    await invalidateFeedCache();
    console.log("✅ Feed cache invalidated successfully");

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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware
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

    await invalidateFeedCache();

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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware
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

    await invalidateFeedCache();

    res.status(200).json({ message: "Project archived successfully" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while archiving project";
    return next(error);
  }
};

// Update project status
export const updateProjectStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user; // User is already authenticated by middleware
    const { projectId } = req.params;
    const { status: rawStatus } = req.body as { status: string };
    const status = normalizeProjectStatus(rawStatus || "");

    // Validate status
    if (
      !status ||
      !(PROJECT_PIPELINE_STATUSES as readonly string[]).includes(status)
    ) {
      res.status(400).json({
        message: `Invalid status. Allowed values: ${PROJECT_PIPELINE_STATUSES.join(", ")}`,
      });
      return;
    }

    const project = await ProjectsModel.findOne({
      _id: projectId,
      author: _id,
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Prevent status changes on deleted/archived projects
    if (project.status === "deleted" || project.status === "archived") {
      res.status(400).json({
        message: `Cannot change status of ${project.status} project. Restore it first.`,
      });
      return;
    }

    if (!canTransitionProjectStatus(project.status, status)) {
      res.status(400).json({
        message: `Cannot change status from ${normalizeProjectStatus(project.status)} to ${status}`,
      });
      return;
    }

    const updatedProject = await ProjectsModel.findByIdAndUpdate(
      projectId,
      { status },
      { new: true },
    );

    await invalidateFeedCache();

    res.status(200).json({
      message: `Project status updated to ${status}`,
      project: updatedProject,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while updating project status";
    return next(error);
  }
};
