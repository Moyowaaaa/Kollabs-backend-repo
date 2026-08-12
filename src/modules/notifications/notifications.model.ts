import { model, Schema } from "mongoose";
import { INotification } from "./notifications.interface";

export const NotificationsSchema = new Schema<INotification>(
  {
    recipientId: {
      type: String,
      ref: "User",
      required: true,
    },
    actorId: {
      type: String,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: [
        "test",
        "project_created",
        "project_updated",
        "project_deleted",
        "project_archived",
        "project_unarchived",
        "project_completed",
        "project_uncompleted",
        "collab_request_received",
        "collab_request_accepted",
        "collab_request_rejected",
        "collaboration_started"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: Object,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    purgeAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

NotificationsSchema.index({ recipientId: 1, createdAt: -1 });
NotificationsSchema.index({ recipientId: 1, isRead: 1, deletedAt: 1 });

export default model<INotification>("Notification", NotificationsSchema);
