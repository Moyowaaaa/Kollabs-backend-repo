import { Types } from "mongoose";

export interface ICollaboratorPopulated {
  _id: string;
  fullName?: string;
  profilePhoto?: string;
}

// Populated author from User model
export interface IAuthorPopulated {
  _id: string;
  email: string;
  userProfile?: {
    firstname: string;
    lastname: string;
    profilePicture?: { url: string; id: string };
    roles?: string[];
    bio?: string;
  };
}

export interface IProjects {
  title: string;
  description: string;
  collaborators: Types.ObjectId[] | ICollaboratorPopulated[];
  status:
    | "draft"
    | "seeking_collaborators"
    | "ongoing"
    | "completed"
    | "deleted"
    | "archived";
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string;
  author: Types.ObjectId | IAuthorPopulated; // ObjectId or populated user
  teamSize: number;
  media?: { url: string; id: string }[]; // Array of {url, publicId} for Cloudinary
  requiredRoles?: string[]; // Roles/skills needed for the project (e.g., "UI/UX Designer", "Frontend")
}

export interface ICreateProject {
  title: string;
  description: string;
  media?: { url: string; id: string }[];
  teamSize: number;
  requiredRoles?: string[];
}
