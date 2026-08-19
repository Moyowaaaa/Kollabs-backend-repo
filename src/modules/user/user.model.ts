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
      github: { type: String, required: false },
      behance: { type: String, required: false },
      website: { type: String, required: false },
      linkedin: { type: String, required: false }, // Add this
    },
    cv: {
      fileUrl: {
        type: String,
        required: false,
      },
      fileId: {
        type: String,
        required: false,
      },
      linkedUrl: {
        type: String,
        required: false,
      },
      fileName: {
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
  { timestamps: true },
);

userProfileSchema.index({ firstname: "text", lastname: "text", roles: "text", bio: "text" },
  {
    weights: { firstname: 10, lastname: 10, roles: 6, bio: 3 },
    name: "user_profiles_text_search",
  },)

const UserProfileModel: Model<IUserInterface> =
  (mongoose.models.UserProfile as Model<IUserInterface>) ||
  mongoose.model<IUserInterface>("UserProfile", userProfileSchema);

export default UserProfileModel;
