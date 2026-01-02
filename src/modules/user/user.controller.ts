import type { NextFunction, Response } from "express";
import { IError } from "../../interfaces/error.interface";
import UserProfileModel from "./user.model";
import { IUserLinks } from "./user.interface";
import {
  uploadSingleToCloudinary,
  deleteSingleFromCloudinary,
} from "../../utils/cloudinary";
import { AuthenticatedRequest } from "../auth/auth.interface";
import userAuthModel from "../auth/auth.model";

// Get current authenticated user with profile
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = await userAuthModel
      .findById(req.user._id)
      .populate("userProfile")
      .select("-password");

    if (!authUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      user: authUser,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while fetching user";
    return next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstname, lastname, roles, bio, links } = req.body as {
      firstname?: string;
      lastname?: string;
      roles?: string[];
      bio?: string;
      links?: IUserLinks;
    };

    // Find the user's profile
    const authUser = await userAuthModel.findById(req.user._id);
    if (!authUser?.userProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;
    if (roles) updateData.roles = roles;
    if (bio !== undefined) updateData.bio = bio;
    if (links) updateData.links = links;

    // Handle profile picture update if provided
    if (req.file) {
      // Get current profile to check for existing picture
      const currentProfile = await UserProfileModel.findById(
        authUser.userProfile
      );

      // Delete old profile picture from Cloudinary if exists
      if (currentProfile?.profilePicture?.id) {
        await deleteSingleFromCloudinary(currentProfile.profilePicture.id);
      }

      // Upload new picture
      const uploadResult = await uploadSingleToCloudinary(
        req.file,
        "user_profiles"
      );
      updateData.profilePicture = {
        url: uploadResult.secure_url,
        id: uploadResult.public_id,
      };
    }

    // Update the profile
    const updatedProfile = await UserProfileModel.findByIdAndUpdate(
      authUser.userProfile,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while updating profile";
    return next(error);
  }
};
