import { Types } from "mongoose";

export interface ICollaboratorPopulated {
  _id: string;
  fullName?: string;
  profilePhoto?: string;
}

export interface IProjects {
  title: string;
  description: string;
  collaborators: Types.ObjectId[] | ICollaboratorPopulated[];
  status:
    | "draft"
    | "pending"
    | "ongoing"
    | "completed"
    | "deleted"
    | "archived";
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string;
  author: string;
  teamSize: number;
  media?: { url: string; id: string }[]; // Array of {url, publicId} for Cloudinary
}

export interface ICreateProject {
  title: string;
  description: string;
  media?: { url: string; id: string }[];
  teamSize: number;
}
