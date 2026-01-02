import type { Request, Response } from "express";
import mongoose from "mongoose";
import userAuthModel from "./auth.model";
import { createAuthToken } from "../../utils/createAuthToken";
import { IChangePassword, ISignupRequest } from "./auth.interface";
import UserProfileModel from "../user/user.model";
import { IUserInterface, IUserLinks } from "../user/user.interface";
import { uploadSingleToCloudinary } from "../../utils/cloudinary";

//signup - creates both auth and profile records atomically
export const signUpUser = async (req: Request, res: Response) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, firstname, lastname, roles, bio, links } =
      req.body as ISignupRequest;
    // Parse roles if sent as JSON string (from form-data)
    let parsedRoles: string[] = Array.isArray(roles) ? roles : [];
    if (typeof roles === "string") {
      try {
        parsedRoles = JSON.parse(roles) as string[];
      } catch {
        parsedRoles = [roles];
      }
    }

    // Parse links if sent as JSON string (from form-data)
    let parsedLinks: IUserLinks | undefined =
      typeof links === "object" ? links : undefined;
    if (typeof links === "string") {
      try {
        parsedLinks = JSON.parse(links) as IUserLinks;
      } catch {
        parsedLinks = undefined;
      }
    }

    // Create auth record (uses static method for validation & hashing)
    const authUser = await userAuthModel.signUpUser(email, password);

    // Handle profile picture upload if provided
    let profilePicture: { url: string; id: string } | undefined;
    if (req.file) {
      const uploadResult = await uploadSingleToCloudinary(
        req.file,
        "user_profiles"
      );
      profilePicture = {
        url: uploadResult.secure_url,
        id: uploadResult.public_id,
      };
    }

    // Create profile record
    const profiles = await UserProfileModel.create(
      [
        {
          authUser: authUser._id,
          firstname,
          lastname,
          roles: parsedRoles,
          bio,
          links: parsedLinks,
          profilePicture,
          isVerified: false,
        },
      ],
      { session }
    );
    const profile = profiles[0] as IUserInterface;

    // Link profile to auth record
    await userAuthModel.findByIdAndUpdate(
      authUser._id,
      { userProfile: profile._id },
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();

    // Generate token
    const token = createAuthToken(authUser._id);

    res.status(201).json({
      message: "User successfully signed up",
      token,
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
  } finally {
    void session.endSession();
  }
};

//login
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await userAuthModel.loginUser(email, password);
    const token = createAuthToken(user._id);
    res.status(200).json({ message: "User logged in", token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
  }
};

//change password
export const changePassword = async (
  req: Request<IChangePassword>,
  res: Response
) => {
  const { email, newPassword, comparePassword } = req.body as IChangePassword;
  try {
    await userAuthModel.changePassword(email, newPassword, comparePassword);
    res.status(200).json({ message: "User password changed successfully" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
  }
};
