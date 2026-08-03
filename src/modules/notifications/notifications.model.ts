import { model, Schema } from "mongoose";
import { INotification } from "./notifications.interface";

export  const NotificationsSchema = new Schema<INotification>({
    recipientId: {
        type: String,
        ref: "User",
        required: true,
    },
    actorId: {
        type: String,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["test", "project_created", "project_updated", "project_deleted", "project_archived", "project_unarchived", "project_completed", "project_uncompleted", "collab_request_received", "collab_request_accepted"],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default model<INotification>("Notification", NotificationsSchema);