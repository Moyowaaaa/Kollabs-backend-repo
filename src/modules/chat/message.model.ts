import { model, Schema } from "mongoose";
import {
  IMessage,
  IMessageAttachment,
  IMessagePoll,
  IMessageReaction,
  IMessageReadReceipt,
  IPollOption,
} from "./chat.interface";

const messageAttachmentSchema = new Schema<IMessageAttachment>(
  {
    url: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    kind: {
      type: String,
      enum: ["photo", "video", "document", "audio"],
      required: true,
    },
    thumbnail: {
      type: String,
      required: false,
    },
  },
  { _id: false },
);

const pollOptionSchema = new Schema<IPollOption>(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    voterIds: {
      type: [{ type: String, ref: "User" }],
      default: [],
    },
  },
  { _id: false },
);

const messagePollSchema = new Schema<IMessagePoll>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [pollOptionSchema],
      required: true,
      validate: {
        validator: (options: IPollOption[]) =>
          Array.isArray(options) && options.length >= 2,
        message: "A poll must have at least 2 options",
      },
    },
    allowMultiple: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    closesAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const messageReadReceiptSchema = new Schema<IMessageReadReceipt>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false },
);

const messageReactionSchema = new Schema<IMessageReaction>(
  {
    id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
    reactedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false },
);

export const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      ref: "Conversation",
      required: true,
      index: true,
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
      default: "text",
    },
    content: {
      type: String,
      required: false,
      trim: true,
    },
    attachments: {
      type: [messageAttachmentSchema],
      default: [],
    },
    poll: {
      type: messagePollSchema,
      required: false,
    },
    readBy: {
      type: [messageReadReceiptSchema],
      default: [],
    },
    reactions: {
      type: [messageReactionSchema],
      default: [],
    },
    systemEvent: {
      type: String,
      required: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, deletedAt: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

const MessageModel = model<IMessage>("Message", messageSchema);

export default MessageModel;
