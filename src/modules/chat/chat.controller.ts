import type { NextFunction, Response } from "express";
import { Types } from "mongoose";
import { IError } from "../../interfaces/error.interface";
import { AuthenticatedRequest } from "../auth/auth.interface";
import userAuthModel from "../auth/auth.model";
import ConversationModel from "./conversation.model";
import {
  ICreateDmPayload,
  IConversationMember,
  ICreateGroupPayload,
  ConversationMemberRole,
  ICreateKollaborationPayload,
  IConversationAvatar,
  ConversationType,
  ISendMessagePayload,
  IVotePollPayload,
  AttachmentKind,
  IMessageAttachment,
} from "./chat.interface";
import ProjectsModel from "../projects/projects.model";
import {
  canTransitionProjectStatus,
  normalizeProjectStatus,
} from "../projects/project-status";
import { invalidateFeedCache } from "../feed/feed.controller";
import {
  uploadMultipleToCloudinary,
  uploadSingleToCloudinary,
} from "../../utils/cloudinary";
import { createNotification } from "../notifications";
import MessageModel from "./message.model";
import { getIO } from "../../lib/socket";

const resolveAttachmentKind = (mimeType: string): AttachmentKind => {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
};

const buildDmKey = (userA: string, userB: string) =>
  [userA, userB].sort().join("_");

const buildMember = (
  userId: string,
  role?: ConversationMemberRole,
): IConversationMember => ({
  userId,
  role: role ?? "member",
  joinedAt: new Date(),
  unreadCount: 0,
  lastReadAt: null,
  isMuted: false,
  isArchived: false,
  leftAt: null,
});

/** Normalize memberIds from JSON body or multipart form-data */
const parseMemberIds = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // fall through to comma-separated
    }

    return trimmed
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [];
};

export const createDMConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { recipientId } = req.body as ICreateDmPayload;

    if (!recipientId || typeof recipientId !== "string") {
      res.status(400).json({ message: "recipientId is required" });
      return;
    }

    if (!Types.ObjectId.isValid(recipientId)) {
      res.status(400).json({ message: "Invalid recipientId" });
      return;
    }

    if (recipientId === currentUserId) {
      res.status(400).json({ message: "You cannot start a DM with yourself" });
      return;
    }

    const recipient = await userAuthModel.findById(recipientId).select("_id");
    if (!recipient) {
      res.status(404).json({ message: "Recipient not found" });
      return;
    }

    const dmKey = buildDmKey(currentUserId, recipientId);

    const existingConversation = await ConversationModel.findOne({
      type: "dm",
      dmKey,
    });

    if (existingConversation) {
      res.status(200).json({
        message: "DM conversation already exists",
        created: false,
        conversation: existingConversation,
      });
      return;
    }

    try {
      const conversation = await ConversationModel.create({
        type: "dm",
        createdBy: currentUserId,
        dmKey,
        projectId: null,
        participantIds: [currentUserId, recipientId],
        members: [buildMember(currentUserId), buildMember(recipientId)],
        lastMessage: null,
      });

      res.status(201).json({
        message: "DM conversation created successfully",
        created: true,
        conversation,
      });
    } catch (createError) {
      // Race: another request created the same dmKey first
      const duplicate =
        typeof createError === "object" &&
        createError !== null &&
        "code" in createError &&
        (createError as { code?: number }).code === 11000;

      if (duplicate) {
        const conversation = await ConversationModel.findOne({
          type: "dm",
          dmKey,
        });

        if (conversation) {
          res.status(200).json({
            message: "DM conversation already exists",
            created: false,
            conversation,
          });
          return;
        }
      }

      throw createError;
    }
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message || "An error occurred while creating conversation";
    return next(error);
  }
};

//create group conversation

export const createGroupConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { name, avatar: avatarFromBody } = req.body as ICreateGroupPayload;
    const memberIds = parseMemberIds(
      (req.body as ICreateGroupPayload).memberIds,
    );

    if (!name?.trim()) {
      res.status(400).json({ message: "A group name is required" });
      return;
    }

    if (memberIds.length === 0) {
      res.status(400).json({
        message: "Members are required to create a group conversation",
      });
      return;
    }

    const inviteIds = [...new Set(memberIds)].filter(
      (id) => id !== currentUserId,
    );

    if (inviteIds.length === 0) {
      res.status(400).json({
        message: "Members are required to create a group conversation",
      });
      return;
    }

    if (inviteIds.some((id) => !Types.ObjectId.isValid(id))) {
      res.status(400).json({ message: "Invalid memberId" });
      return;
    }

    const existingMembers = await userAuthModel
      .find({ _id: { $in: inviteIds } })
      .select("_id");

    if (existingMembers.length !== inviteIds.length) {
      res.status(404).json({ message: "One or more members were not found" });
      return;
    }

    let avatar: IConversationAvatar | null = avatarFromBody ?? null;

    if (req.file) {
      const uploadResult = await uploadSingleToCloudinary(
        req.file,
        "chat_group_avatars",
      );
      avatar = {
        url: uploadResult.secure_url,
        id: uploadResult.public_id,
      };
    }

    const groupConversation = await ConversationModel.create({
      avatar,
      type: "group",
      createdBy: currentUserId,
      participantIds: [currentUserId, ...inviteIds],
      name: name.trim(),
      members: [
        buildMember(currentUserId, "owner"),
        ...inviteIds.map((id) => buildMember(id, "member")),
      ],
      lastMessage: null,
      dmKey: null,
      projectId: null,
    });

    res.status(201).json({
      message: "Group conversation created successfully",
      created: true,
      conversation: groupConversation,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message ||
      "An error occurred while creating this group conversation";
    return next(error);
  }
};

//create kollaboration
export const createKollaboration = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { projectId } = req.body as ICreateKollaborationPayload;

    if (!projectId) {
      res
        .status(400)
        .json({ message: "A projectId is required to create a kollaboration" });
      return;
    }

    if (!Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }

    const existingProject = await ProjectsModel.findOne({ _id: projectId });
    if (!existingProject) {
      res
        .status(404)
        .json({ message: "Project not found, please check and try again" });
      return;
    }

    const currentStatus = normalizeProjectStatus(existingProject.status);
    const canStartFromStatus =
      currentStatus === "ongoing" ||
      currentStatus === "seeking_collaborators" ||
      canTransitionProjectStatus(existingProject.status, "ongoing");

    if (!canStartFromStatus) {
      res.status(400).json({
        message:
          "Project must be seeking collaborators (or already ongoing) to start a Kollaboration",
      });
      return;
    }

    const authorId = String(
      existingProject.author._id ?? existingProject.author,
    );

    if (currentUserId !== authorId) {
      res.status(403).json({
        message: "Only the author of a project can start a Kollaboration",
      });
      return;
    }

    // Starting kollaboration moves the project into ongoing
    const statusChanged = currentStatus !== "ongoing";
    if (statusChanged) {
      existingProject.status = "ongoing";
    }

    const collaboratorIds = existingProject.collaborators.map((c) =>
      String(typeof c === "object" && c !== null && "_id" in c ? c._id : c),
    );

    // Prefer linked conversationId; fall back to projectId uniqueness lookup
    let existingKollaboration = existingProject.conversationId
      ? await ConversationModel.findOne({
          type: "kollaboration",
          _id: existingProject.conversationId,
        })
      : null;

    if (!existingKollaboration) {
      existingKollaboration = await ConversationModel.findOne({
        type: "kollaboration",
        projectId: String(existingProject._id),
      });
    }

    if (existingKollaboration) {
      // Repair stale / missing link on the project
      let projectDirty = false;
      if (
        existingProject.conversationId !== String(existingKollaboration._id)
      ) {
        existingProject.conversationId = String(existingKollaboration._id);
        projectDirty = true;
      }
      if (statusChanged) {
        projectDirty = true;
      }
      if (projectDirty) {
        await existingProject.save();
        if (statusChanged) {
          await invalidateFeedCache();
        }
      }

      res.status(200).json({
        message: "Kollaboration on this project already exists",
        created: false,
        conversation: existingKollaboration,
      });
      return;
    }

    try {
      const kollaboration = await ConversationModel.create({
        type: "kollaboration",
        createdBy: currentUserId,
        dmKey: null,
        projectId: String(existingProject._id),
        lastMessage: null,
        name: `Kollaboration · ${existingProject.title}`,
        members: [
          buildMember(currentUserId, "owner"),
          ...collaboratorIds.map((id) => buildMember(id, "member")),
        ],
        participantIds: [currentUserId, ...collaboratorIds],
      });

      existingProject.conversationId = String(kollaboration._id);
      await existingProject.save();
      await invalidateFeedCache();

      await Promise.all(
        collaboratorIds.map((recipientId) =>
          createNotification({
            title: `Kollaboration on ${existingProject.title} started`,
            body: `A team chat is now open for ${existingProject.title}`,
            recipientId,
            actorId: currentUserId,
            type: "collaboration_started",
            meta: {
              projectId: String(existingProject._id),
              conversationId: String(kollaboration._id),
            },
          }),
        ),
      );

      res.status(201).json({
        message: "Kollaboration started for this project",
        created: true,
        conversation: kollaboration,
      });
    } catch (createError) {
      const duplicate =
        typeof createError === "object" &&
        createError !== null &&
        "code" in createError &&
        (createError as { code?: number }).code === 11000;

      if (duplicate) {
        const conversation = await ConversationModel.findOne({
          type: "kollaboration",
          projectId: String(existingProject._id),
        });

        if (conversation) {
          existingProject.conversationId = String(conversation._id);
          await existingProject.save();

          res.status(200).json({
            message: "Kollaboration on this project already exists",
            created: false,
            conversation,
          });
          return;
        }
      }

      throw createError;
    }
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message || "An error occurred while creating this Kollaboration";
    return next(error);
  }
};

// Get conversations (optional ?type=dm|group|kollaboration)
export const getUserConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const limit = Number(req.query.limit) || 15;
    const page = Number(req.query.page) || 1;
    const type =
      typeof req.query.type === "string" ? req.query.type : undefined;

    const allowedTypes: ConversationType[] = ["dm", "group", "kollaboration"];

    if (type && !allowedTypes.includes(type as ConversationType)) {
      res.status(400).json({
        message: "Invalid type. Allowed values: dm, group, kollaboration",
      });
      return;
    }

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      participantIds: currentUserId,
      members: {
        $elemMatch: {
          userId: currentUserId,
          leftAt: null,
        },
      },
    };

    if (type) {
      filter.type = type;
    }

    const [conversations, totalConversations] = await Promise.all([
      ConversationModel.find(filter)
        .populate({
          path: "participantIds",
          select: "email userProfile",
          populate: {
            path: "userProfile",
            select: "firstname lastname profilePicture",
          },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      ConversationModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalConversations / limit);

    res.status(200).json({
      conversations,
      pagination: {
        totalConversations,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message || "An error occurred while fetching conversations";
    return next(error);
  }
};

//Get a conversation
export const getUserConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const conversationId = req.params.conversationId;

    if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({
        message: "A valid conversationId is required",
      });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: currentUserId,
      members: {
        $elemMatch: {
          userId: currentUserId,
          leftAt: null,
        },
      },
    }).populate({
      path: "participantIds",
      select: "email userProfile",
      populate: {
        path: "userProfile",
        select: "firstname lastname profilePicture",
      },
    });

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    res.status(200).json({
      message: "Conversation found",
      conversation,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message || "An error occurred while fetching conversation";
    return next(error);
  }
};

// Mark conversation as read for the current user
export const markConversationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const conversationId = req.params.conversationId;

    if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({
        message: "A valid conversationId is required",
      });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: currentUserId,
      members: {
        $elemMatch: {
          userId: currentUserId,
          leftAt: null,
        },
      },
    });

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    const now = new Date();
    const member = conversation.members.find(
      (m) => m.userId === currentUserId && m.leftAt == null,
    );

    if (!member) {
      res.status(403).json({
        message: "You are not a member of this conversation",
      });
      return;
    }

    member.unreadCount = 0;
    member.lastReadAt = now;
    await conversation.save();

    // Stamp read receipts on messages the caller hadn't marked yet
    await MessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUserId },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        "readBy.userId": { $ne: currentUserId },
      },
      {
        $push: {
          readBy: {
            userId: currentUserId,
            readAt: now,
          },
        },
      },
    );

    res.status(200).json({
      message: "Conversation marked as read",
      conversationId,
      unreadCount: 0,
      lastReadAt: now,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message =
      error.message || "An error occurred while marking conversation as read";
    return next(error);
  }
};

// Send a message
export const SendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { conversationId } = req.params;
    const { attachments, content, poll, type } =
      req.body as ISendMessagePayload;
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : [];

    if (!conversationId) {
      res.status(400).json({ message: "Conversation Id is required" });
      return;
    }

    let messageAttachments: IMessageAttachment[] = Array.isArray(attachments)
      ? attachments
      : [];

    if (uploadedFiles.length > 0) {
      const uploadResults = await uploadMultipleToCloudinary(
        uploadedFiles,
        "chat_attachments",
      );

      messageAttachments = uploadResults.map((result, index) => {
        const file = uploadedFiles[index];
        return {
          url: result.secure_url,
          id: result.public_id,
          name: file.originalname || `attachment-${index + 1}`,
          mimeType: file.mimetype,
          size: file.size,
          kind: resolveAttachmentKind(file.mimetype),
        };
      });
    }

    const messageType =
      type ??
      (messageAttachments.length > 0
        ? "attachment"
        : poll
          ? "poll"
          : "text");

    if (messageType === "text" && !content?.trim()) {
      res
        .status(400)
        .json({ message: "Content is required for a text message" });
      return;
    }
    if (messageType === "poll") {
      if (!poll?.question?.trim()) {
        res.status(400).json({ message: "Poll question is required" });
        return;
      }
      if (!Array.isArray(poll.options) || poll.options.length < 2) {
        res
          .status(400)
          .json({ message: "A poll must have at least 2 options" });
        return;
      }
    }
    if (messageType === "attachment" && messageAttachments.length === 0) {
      res.status(400).json({ message: "At least one attachment is required" });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: currentUserId,
      members: { $elemMatch: { userId: currentUserId, leftAt: null } },
    });

    if (!conversation) {
      res.status(403).json({
        message: "You are not a member of this conversation",
      });
      return;
    }

    const pollPayload =
      messageType === "poll" && poll
        ? {
            question: poll.question.trim(),
            options: poll.options.map((text) => ({
              id: new Types.ObjectId().toString(),
              text: String(text).trim(),
              voterIds: [] as string[],
            })),
            allowMultiple: poll.allowMultiple ?? false,
            isAnonymous: poll.isAnonymous ?? false,
            isClosed: false,
            closesAt: poll.closesAt ?? null,
          }
        : undefined;

    const message = await MessageModel.create({
      senderId: currentUserId,
      attachments:
        messageType === "attachment" ? messageAttachments : [],
      poll: pollPayload,
      content: content?.trim() || undefined,
      conversationId,
      type: messageType,
      readBy: [{ userId: currentUserId, readAt: new Date() }],
    });

    conversation.lastMessage = {
      text:
        content?.trim() ||
        poll?.question?.trim() ||
        (messageType === "attachment" ? "Sent an attachment" : undefined),
      senderId: currentUserId,
      type: messageType,
      createdAt: message.createdAt,
    };
    conversation.members.forEach((m) => {
      if (m.userId !== currentUserId) {
        m.unreadCount = (m.unreadCount ?? 0) + 1;
      }
    });
    await conversation.save();
    
    const recipients = conversation.members
    .filter((m) => m.userId !== currentUserId && !m.leftAt)
    .map((m) => m.userId);

    const actorProfile = await userAuthModel
  .findById(currentUserId)
  .populate<{ userProfile?: { firstname?: string; lastname?: string } }>(
    "userProfile",
    "firstname lastname",
  )
  .lean();

  const profile = actorProfile?.userProfile;
const actorName =
  profile?.firstname || profile?.lastname
    ? `${profile?.firstname ?? ""} ${profile?.lastname ?? ""}`.trim()
    : actorProfile?.email || "Someone";
 

    const body =
  messageType === "attachment"
    ? "Sent an attachment"
    : messageType === "poll"
      ? pollPayload?.question || "Started a poll"
      : content?.trim() || "Sent a message";

      await Promise.all(
        recipients.map((recipientId) =>
          createNotification({
            title: `New message from ${actorName}`,
            body,
            type: "new_message",
            recipientId,
            actorId: currentUserId,
            meta: {
              conversationId: String(conversation._id),
              conversationType: conversation.type,
            },
          }),
        ),
      );

    getIO()
      ?.to(`conversation:${conversationId}`)
      .emit("chat:message", {
        conversationId: String(conversation._id),
        message: message.toJSON(),
      });

    res.status(201).json({
      message: "Message sent",
      data: message,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = error.message || "An error occurred while sending message";
    return next(error);
  }
};


// Get spotlighted / recent messages for the dashboard (default 5)
export const getRecentMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 10);

    const conversations = await ConversationModel.find({
      participantIds: currentUserId,
      members: {
        $elemMatch: {
          userId: currentUserId,
          leftAt: null,
        },
      },
    })
      .select("_id name type avatar participantIds")
      .populate({
        path: "participantIds",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture",
        },
      })
      .lean();

    const conversationIds = conversations.map((conversation) =>
      String(conversation._id),
    );

    if (conversationIds.length === 0) {
      res.status(200).json({ messages: [] });
      return;
    }

    const messages = await MessageModel.find({
      conversationId: { $in: conversationIds },
      deletedAt: null,
      type: { $ne: "system" },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "senderId",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture",
        },
      })
      .lean();

    const conversationById = new Map(
      conversations.map((conversation) => [
        String(conversation._id),
        conversation,
      ]),
    );

    type PopulatedSender = {
      _id: unknown;
      email?: string;
      userProfile?: {
        firstname?: string;
        lastname?: string;
        profilePicture?: { url?: string; id?: string };
      } | null;
    };

    const enrichedMessages = messages.map((message) => {
      const populatedSender =
        typeof message.senderId === "object" && message.senderId !== null
          ? (message.senderId as PopulatedSender)
          : null;

      return {
        _id: String(message._id),
        conversationId: String(message.conversationId),
        type: message.type,
        content: message.content,
        createdAt: message.createdAt,
        senderId: populatedSender
          ? String(populatedSender._id)
          : String(message.senderId),
        sender: populatedSender
          ? {
              _id: String(populatedSender._id),
              email: populatedSender.email,
              userProfile: populatedSender.userProfile ?? null,
            }
          : null,
        conversation:
          conversationById.get(String(message.conversationId)) ?? null,
      };
    });

    res.status(200).json({
      messages: enrichedMessages,
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message =
      err.message || "An error occurred while fetching recent messages";
    return next(err);
  }
};

//Get chat messages in a conversation
export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { conversationId } = req.params;

    const limit = Number(req.query.limit) || 30;
    const page = Number(req.query.page) || 1;
    const skip = (Number(page) - 1) * Number(limit);

    if (!conversationId) {
      res.status(400).json({ message: "A valid conversation Id is required" });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: currentUserId,
      members: { $elemMatch: { userId: currentUserId, leftAt: null } },
    });

    if (!conversation) {
      res.status(403).json({
        message: "You are not a member of this conversation",
      });
      return;
    }

    const filter = {
      conversationId,
      deletedAt: null,
    };
    const [messages, totalMessages] = await Promise.all([
      MessageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      MessageModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalMessages / limit);

    res.status(200).json({
      messages,
      pagination: {
        totalMessages,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message =
      err.message || "An error occurred while fetching conversation messages";
    return next(err);
  }
};

// Vote on a poll message
export const votePoll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUserId = String(req.user._id);
    const { messageId } = req.params;
    const { optionIds } = req.body as IVotePollPayload;

    if (!messageId || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ message: "A valid messageId is required" });
      return;
    }

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      res.status(400).json({ message: "At least one optionId is required" });
      return;
    }

    const message = await MessageModel.findOne({
      _id: messageId,
      type: "poll",
      deletedAt: null,
    });

    if (!message || !message.poll) {
      res.status(404).json({ message: "Poll message not found" });
      return;
    }

    const conversation = await ConversationModel.findOne({
      _id: message.conversationId,
      participantIds: currentUserId,
      members: { $elemMatch: { userId: currentUserId, leftAt: null } },
    });

    if (!conversation) {
      res.status(403).json({
        message: "You are not a member of this conversation",
      });
      return;
    }

    if (message.poll.isClosed) {
      res.status(400).json({ message: "This poll is closed" });
      return;
    }

    if (
      message.poll.closesAt &&
      new Date(message.poll.closesAt).getTime() <= Date.now()
    ) {
      message.poll.isClosed = true;
      await message.save();
      res.status(400).json({ message: "This poll has expired" });
      return;
    }

    const validOptionIds = new Set(message.poll.options.map((o) => o.id));
    const uniqueOptionIds = [...new Set(optionIds.map(String))];

    if (uniqueOptionIds.some((id) => !validOptionIds.has(id))) {
      res.status(400).json({ message: "One or more optionIds are invalid" });
      return;
    }

    if (!message.poll.allowMultiple && uniqueOptionIds.length > 1) {
      res.status(400).json({
        message: "This poll only allows a single vote",
      });
      return;
    }

    // Clear previous votes by this user, then apply new selection(s)
    message.poll.options.forEach((option) => {
      option.voterIds = (option.voterIds ?? []).filter(
        (id) => id !== currentUserId,
      );
    });

    uniqueOptionIds.forEach((optionId) => {
      const option = message.poll?.options.find((o) => o.id === optionId);
      if (option) {
        option.voterIds = [...(option.voterIds ?? []), currentUserId];
      }
    });

    message.markModified("poll");
    await message.save();

    res.status(200).json({
      message: "Vote recorded",
      data: message,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = error.message || "An error occurred while voting on poll";
    return next(error);
  }
};
