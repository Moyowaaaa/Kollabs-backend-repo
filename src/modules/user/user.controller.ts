import type { NextFunction, Response } from "express";
import { IError } from "../../interfaces/error.interface";
import UserProfileModel from "./user.model";
import { IUserLinks, IUserCV } from "./user.interface";
import {
  uploadSingleToCloudinary,
  deleteSingleFromCloudinary,
} from "../../utils/cloudinary";
import { AuthenticatedRequest } from "../auth/auth.interface";
import userAuthModel from "../auth/auth.model";

// Type for multer fields upload
interface MulterFiles {
  image?: Express.Multer.File[];
  cv?: Express.Multer.File[];
}

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
    const { firstname, lastname, roles, bio, links, cvLinkedUrl } =
      req.body as {
        firstname?: string;
        lastname?: string;
        roles?: string[];
        bio?: string;
        links?: IUserLinks;
        cvLinkedUrl?: string;
      };

    const authUser = await userAuthModel.findById(req.user._id);
    if (!authUser?.userProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const currentProfile = await UserProfileModel.findById(
      authUser.userProfile
    );

    const updateData: Record<string, unknown> = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;
    if (roles) updateData.roles = roles;
    if (bio !== undefined) updateData.bio = bio;
    if (links) updateData.links = links;

    const files = req.files as MulterFiles | undefined;

    if (files?.image?.[0]) {
      if (currentProfile?.profilePicture?.id) {
        await deleteSingleFromCloudinary(currentProfile.profilePicture.id);
      }

      const uploadResult = await uploadSingleToCloudinary(
        files.image[0],
        "user_profiles"
      );
      updateData.profilePicture = {
        url: uploadResult.secure_url,
        id: uploadResult.public_id,
      };
    }

    if (files?.cv?.[0]) {
      if (currentProfile?.cv?.fileId) {
        await deleteSingleFromCloudinary(currentProfile.cv.fileId);
      }

      const cvFile = files.cv[0];
      const uploadResult = await uploadSingleToCloudinary(cvFile, "user_cvs");

      const cvData: IUserCV = {
        fileUrl: uploadResult.secure_url,
        fileId: uploadResult.public_id,
        fileName: cvFile.originalname,
      };
      updateData.cv = cvData;
    } else if (cvLinkedUrl !== undefined) {
      if (cvLinkedUrl) {
        if (currentProfile?.cv?.fileId) {
          await deleteSingleFromCloudinary(currentProfile.cv.fileId);
        }
        updateData.cv = { linkedUrl: cvLinkedUrl };
      } else {
        updateData.cv = null;
      }
    }

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
