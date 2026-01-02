import mongoose, { Schema, Model } from "mongoose";
import { IUserInterface } from "./user.interface";

const userProfileSchema = new Schema<IUserInterface>(
  {
    authUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      required: true,
    },
    profilePicture: {
      type: { url: String, id: String },
      required: false,
    },
    bio: {
      type: String,
      maxLength: 150,
      required: false,
    },
    links: {
      github: {
        type: String,
        required: false,
      },
      behance: {
        type: String,
        required: false,
      },
      website: {
        type: String,
        required: false,
      },
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

const UserProfileModel: Model<IUserInterface> =
  (mongoose.models.UserProfile as Model<IUserInterface>) ||
  mongoose.model<IUserInterface>("UserProfile", userProfileSchema);

export default UserProfileModel;
