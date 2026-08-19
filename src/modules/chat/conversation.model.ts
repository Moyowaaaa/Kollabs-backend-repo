import { model, Schema } from "mongoose";
import {
  IConversation,
  IConversationLastMessage,
  IConversationMember,
} from "./chat.interface";

const conversationMemberSchema = new Schema<IConversationMember>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const conversationLastMessageSchema = new Schema<IConversationLastMessage>(
  {
    text: {
      type: String,
      required: false,
    },
    senderId: {
      type: String,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "attachment", "poll", "system"],
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

export const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["dm", "group", "kollaboration"],
      required: true,
    },
    participantIds: {
      type: [{ type: String, ref: "User" }],
      required: true,
      default: [],
    },
    members: {
      type: [conversationMemberSchema],
      required: true,
      default: [],
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    avatar: {
      type: {
        url: { type: String, required: true },
        id: { type: String, required: true },
      },
      required: false,
      default: null,
    },
    createdBy: {
      type: String,
      ref: "User",
      required: true,
    },
    projectId: {
      type: String,
      ref: "Projects",
      required: false,
      default: null,
    },
    dmKey: {
      type: String,
      required: false,
      default: null,
    },
    lastMessage: {
      type: conversationLastMessageSchema,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

// One DM thread per unique user pair
conversationSchema.index(
  { dmKey: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "dm", dmKey: { $type: "string" } },
  },
);

// One Kollaboration chat per project
conversationSchema.index(
  { projectId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "kollaboration",
      projectId: { $type: "string" },
    },
  },
);

conversationSchema.index({ participantIds: 1, updatedAt: -1 });
conversationSchema.index({ type: 1, updatedAt: -1 });
conversationSchema.index({ "members.userId": 1, "members.isArchived": 1 });

const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema,
);

export default ConversationModel;
