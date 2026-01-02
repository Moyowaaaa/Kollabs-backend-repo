import type { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import userAuthModel from "./auth.model";
import { createAuthToken } from "../../utils/createAuthToken";
import {
  IChangePassword,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  ISignupRequest,
} from "./auth.interface";
import UserProfileModel from "../user/user.model";
import { IUserInterface, IUserLinks } from "../user/user.interface";
import { uploadSingleToCloudinary } from "../../utils/cloudinary";
import { sendPasswordResetEmail } from "../../utils/email.service";

export const signUpUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, firstname, lastname, roles, bio, links } =
      req.body as ISignupRequest;
    let parsedRoles: string[] = Array.isArray(roles) ? roles : [];
    if (typeof roles === "string") {
      try {
        parsedRoles = JSON.parse(roles) as string[];
      } catch {
        parsedRoles = [roles];
      }
    }

    let parsedLinks: IUserLinks | undefined =
      typeof links === "object" ? links : undefined;
    if (typeof links === "string") {
      try {
        parsedLinks = JSON.parse(links) as IUserLinks;
      } catch {
        parsedLinks = undefined;
      }
    }

    const authUser = await userAuthModel.signUpUser(email, password);

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

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as IForgotPasswordRequest;

  try {
    // Find user by email
    const user = await userAuthModel.findOne({ email });

    if (!user) {
      res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An error occurred sending the email" });
    }
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body as IResetPasswordRequest;

  try {
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userAuthModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    // Hash the new password
    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An error occurred resetting password" });
    }
  }
};
