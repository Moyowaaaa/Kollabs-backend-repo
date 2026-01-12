import { model, Schema } from "mongoose";
import { ICollaborationRequest } from "./collaboration-requests.interface";

export const collaborationRequestSchema = new Schema<ICollaborationRequest>(
  {
    projectId: {
      type: String,
      ref: "Projects",
      required: true,
    },
    requesterId: {
      type: String,
      ref: "User",
      required: true,
    },
    proposal: {
      type: String,
      required: true,
    },
    media: {
      type: [{ url: String, id: String }],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate requests from same user to same project
collaborationRequestSchema.index(
  { projectId: 1, requesterId: 1 },
  { unique: true }
);

const CollaborationRequestModel = model<ICollaborationRequest>(
  "CollaborationRequest",
  collaborationRequestSchema
);

export default CollaborationRequestModel;
