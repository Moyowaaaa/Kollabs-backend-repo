import type { NextFunction, Request, Response } from "express";
import { IError } from "../../interfaces/error.interface";
import jwt from "jsonwebtoken";
import { jwtToken } from "../../middleware/authMiddleware";
import CollaborationRequestModel from "./collaboration-requests.model";
import ProjectsModel from "../projects/projects.model";
import { uploadMultipleToCloudinary } from "../../utils/cloudinary";
import { invalidateFeedCache } from "../feed/feed.controller";
import { Types } from "mongoose";
import type { IAuthorPopulated } from "../projects/projects.interface";
import { createNotification } from "../notifications";
import { UserModel } from "../user";

// Helper to safely get author ID string from ObjectId or populated object
const getAuthorId = (author: Types.ObjectId | IAuthorPopulated): string => {
  if (typeof author === "object" && author !== null && "_id" in author) {
    return String(author._id);
  }
  return String(author);
};

// Create a collaboration request
export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id: requesterId } = decoded;

    const { projectId } = req.params;
    const { proposal } = req.body as { proposal: string };

    if (!proposal || proposal.trim() === "") {
      res.status(400).json({ message: "Proposal is required" });
      return;
    }

    // Check if project exists and is ongoing
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (project.status !== "ongoing") {
      res.status(400).json({
        message: "Can only request collaboration on ongoing projects",
      });
      return;
    }

    // Check if requester is not the author
    if (getAuthorId(project.author) === requesterId) {
      res.status(400).json({
        message: "You cannot request to collaborate on your own project",
      });
      return;
    }

    // Check if already a collaborator (handle both ObjectId and populated objects)
    const collaboratorIds = project.collaborators.map((c) => {
      if (typeof c === "object" && c !== null && "_id" in c) {
        return String(c._id);
      }
      return String(c);
    });
    if (collaboratorIds.includes(requesterId)) {
      res
        .status(400)
        .json({ message: "You are already a collaborator on this project" });
      return;
    }

    // Check if user already sent a request
    const existingRequest = await CollaborationRequestModel.findOne({
      projectId,
      requesterId,
    });
    if (existingRequest) {
      res.status(400).json({
        message: "You have already requested to collaborate on this project",
      });
      return;
    }

    // Check if project has room for more collaborators (teamSize - 1 for author)
    const maxCollaborators = project.teamSize - 1;
    if (project.collaborators.length >= maxCollaborators) {
      res
        .status(400)
        .json({ message: "Project has reached maximum collaborators" });
      return;
    }

    // Handle media uploads (optional)
    let media: { url: string; id: string }[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        req.files,
        "collaboration_requests",
      );
      media = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));
    }

    const requesterProfile = await UserModel.findOne({ authUser: requesterId });
    const recipientId = getAuthorId(project.author);

    const collaborationRequest = await CollaborationRequestModel.create({
      projectId,
      requesterId,
      proposal,
      media,
    });
    if (requesterProfile && recipientId) {
      const name = requesterProfile
  ? `${requesterProfile.firstname} ${requesterProfile.lastname}`
  : "Someone";

      await createNotification({
        title: "New request",
        actorId: requesterId,
        body: `${name} is requesting to join your project: ${project.title}`,
        recipientId,
        type: "collab_request_received",
        meta: {
          projectId: String(collaborationRequest.projectId),
          collabRequestId: String(collaborationRequest._id),
        },
      });
    }

    res.status(201).json({
      message: "Collaboration request submitted successfully",
      request: collaborationRequest,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while creating collaboration request";
    return next(error);
  }
};

// Get all requests for a project (author only)
export const getRequestsForProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id: userId } = decoded;

    const { projectId } = req.params;

    // Check if project exists and user is the author
    const project = await ProjectsModel.findById(projectId);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (getAuthorId(project.author) !== userId) {
      res.status(403).json({
        message: "Only the project author can view collaboration requests",
      });
      return;
    }

    const requests = await CollaborationRequestModel.find({ projectId })
      .populate("requesterId", "fullName profilePhoto email")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while fetching collaboration requests";
    return next(error);
  }
};

// Get user's own sent requests
export const getMyRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id: userId } = decoded;

    const requests = await CollaborationRequestModel.find({
      requesterId: userId,
    })
      .populate("projectId", "title description status")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while fetching your requests";
    return next(error);
  }
};

// Accept a collaboration request
export const acceptRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id: userId } = decoded;

    const { requestId } = req.params;

    // Find the request
    const collaborationRequest =
      await CollaborationRequestModel.findById(requestId);
    if (!collaborationRequest) {
      res.status(404).json({ message: "Collaboration request not found" });
      return;
    }

    if (collaborationRequest.status !== "pending") {
      res
        .status(400)
        .json({ message: "This request has already been processed" });
      return;
    }

    // Check if user is the project author
    const project = await ProjectsModel.findById(
      collaborationRequest.projectId,
    );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (getAuthorId(project.author) !== userId) {
      res.status(403).json({
        message: "Only the project author can accept collaboration requests",
      });
      return;
    }

    // Re-check teamSize limit at accept time
    const maxCollaborators = project.teamSize - 1;
    if (project.collaborators.length >= maxCollaborators) {
      res
        .status(400)
        .json({ message: "Project has reached maximum collaborators" });
      return;
    }

    // Add requester to collaborators and update request status
    await ProjectsModel.findByIdAndUpdate(collaborationRequest.projectId, {
      $addToSet: { collaborators: collaborationRequest.requesterId },
    });

    await CollaborationRequestModel.findByIdAndUpdate(requestId, {
      status: "accepted",
    });

      await createNotification({
        title: "Proposal approved",
        body: `Your proposal was approved for "${project.title}`,
        meta: {
          projectId: String(collaborationRequest.projectId),
          collabRequestId: String(requestId),
        },
        actorId: getAuthorId(project.author),
        type: "collab_request_accepted",
        recipientId: collaborationRequest.requesterId,
      });

    

    // Invalidate feed cache so changes are visible immediately
    await invalidateFeedCache();

    res
      .status(200)
      .json({ message: "Collaboration request accepted successfully" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while accepting collaboration request";
    return next(error);
  }
};

// Reject a collaboration request
export const rejectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id: userId } = decoded;

    const { requestId } = req.params;

    // Find the request
    const collaborationRequest =
      await CollaborationRequestModel.findById(requestId);
    if (!collaborationRequest) {
      res.status(404).json({ message: "Collaboration request not found" });
      return;
    }

    if (collaborationRequest.status !== "pending") {
      res
        .status(400)
        .json({ message: "This request has already been processed" });
      return;
    }

    // Check if user is the project author
    const project = await ProjectsModel.findById(
      collaborationRequest.projectId,
    );
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (getAuthorId(project.author) !== userId) {
      res.status(403).json({
        message: "Only the project author can reject collaboration requests",
      });
      return;
    }

    await CollaborationRequestModel.findByIdAndUpdate(requestId, {
      status: "rejected",
    });

      await createNotification({
        title: "Proposal rejected",
        body: 'Your proposal was rejected by the project"s author',
        meta: {
          projectId: String(collaborationRequest.projectId),
          collabRequestId: String(requestId),
        },
        actorId: getAuthorId(project.author),
        type: "collab_request_rejected",
        recipientId: collaborationRequest.requesterId,
      });

    res.status(200).json({ message: "Collaboration request rejected" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while rejecting collaboration request";
    return next(error);
  }
};
