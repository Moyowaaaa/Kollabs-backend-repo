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
      type: [String],
      default: [],
    },
    media: {
      type: [{ url: String, id: String }],
      default: [],
      required: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "ongoing", "completed", "deleted"],
      default: "draft",
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
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ProjectsModel = model<IProjects>("Projects", projectsSchema);

export default ProjectsModel;
