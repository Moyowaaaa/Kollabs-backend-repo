import mongoose, { Document, Model } from "mongoose";

// Portfolio links for user profile
export interface IUserLinks {
  github?: string;
  behance?: string;
  website?: string;
  linkedin?: string;
}

export interface IUserCV {
  fileUrl?: string;
  fileId?: string;
  linkedUrl?: string;
  fileName?: string;
}

// Main user interface
export interface IUserInterface extends Document {
  authUser: mongoose.Types.ObjectId;
  firstname: string;
  lastname: string;
  roles: string[];
  bio?: string;
  profilePicture?: { url: string; id: string };
  cv?: IUserCV;
  links?: IUserLinks;
  createdAt?: Date;
  updatedAt?: Date;
  isVerified?: boolean;
}

// For Mongoose model with static methods
export interface IUserModel extends Model<IUserInterface> {
  findByEmail(email: string): Promise<IUserInterface | null>;
}

export interface IUpdateProfileRequest {
  bio: string;
  links: IUserLinks;
  profilePicture?: string;
}
