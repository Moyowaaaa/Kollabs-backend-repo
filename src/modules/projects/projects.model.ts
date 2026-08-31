import { model, Schema } from "mongoose";
import { IProjects } from "./projects.interface";

export const projectsSchema = new Schema<IProjects>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    media: {
      type: [{ url: String, id: String }],
      default: [],
      required: false,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "seeking_collaborators",
        "ongoing",
        "completed",
        "deleted",
        "archived",
      ],
      default: "draft",
    },
    teamSize: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    conversationId: {
      type: String,
      default: null,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requiredRoles: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

// Add text index for search functionality (includes requiredRoles for filtering by skills)
projectsSchema.index(
  { title: "text", description: "text", requiredRoles: "text" },
  {
    weights: { title: 10, description: 5, requiredRoles: 8 },
    name: "projects_text_search",
  },
);

// Feed pagination: public statuses + newest-first compound cursor
projectsSchema.index(
  { status: 1, createdAt: -1, _id: -1 },
  { name: "projects_feed_status_created" },
);

// Own-drafts slice of personalized feed
projectsSchema.index(
  { author: 1, status: 1, createdAt: -1, _id: -1 },
  { name: "projects_feed_author_status_created" },
);

const ProjectsModel = model<IProjects>("Projects", projectsSchema);

export default ProjectsModel;
