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
import { IUserInterface, IUserLinks, IUserCV } from "../user/user.interface";
import { uploadSingleToCloudinary } from "../../utils/cloudinary";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../utils/email.service";

// Type for multer fields upload
interface MulterFiles {
  image?: Express.Multer.File[];
  cv?: Express.Multer.File[];
}

export const signUpUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      email,
      password,
      firstname,
      lastname,
      roles,
      bio,
      links,
      cvLinkedUrl,
    } = req.body as ISignupRequest;
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Update auth user with verification token (expires in 24 hours)
    await userAuthModel.findByIdAndUpdate(
      authUser._id,
      {
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isEmailVerified: false,
      },
      { session },
    );

    // Handle file uploads (now using fields instead of single)
    const files = req.files as MulterFiles | undefined;

    // Profile picture upload
    let profilePicture: { url: string; id: string } | undefined;
    if (files?.image?.[0]) {
      const uploadResult = await uploadSingleToCloudinary(
        files.image[0],
        "user_profiles",
      );
      profilePicture = {
        url: uploadResult.secure_url,
        id: uploadResult.public_id,
      };
    }

    // CV upload (optional)
    let cv: IUserCV | undefined;
    if (files?.cv?.[0]) {
      const cvFile = files.cv[0];
      const uploadResult = await uploadSingleToCloudinary(cvFile, "user_cvs");
      cv = {
        fileUrl: uploadResult.secure_url,
        fileId: uploadResult.public_id,
        fileName: cvFile.originalname,
      };
    } else if (cvLinkedUrl) {
      // User provided external CV link instead of upload
      cv = {
        linkedUrl: cvLinkedUrl,
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
          cv,
          isVerified: false,
        },
      ],
      { session },
    );
    const profile = profiles[0] as IUserInterface;

    // Link profile to auth record
    await userAuthModel.findByIdAndUpdate(
      authUser._id,
      { userProfile: profile._id },
      { session },
    );

    // Commit the transaction
    await session.commitTransaction();

    // Send verification email (after transaction commits)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationUrl = `${frontendUrl}/auth/verify-email/${verificationToken}`;

    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailError) {
      // Log error but don't fail signup if email fails
      console.error("Failed to send verification email:", emailError);
    }

    res.status(201).json({
      message:
        "User successfully signed up. Please check your email to verify your account.",
      isEmailVerified: false,
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

    // Populate user profile for response
    const populatedUser = await userAuthModel
      .findById(user._id)
      .populate("userProfile");

    const token = createAuthToken(user._id);

    // Extract profile data safely
    const profile = populatedUser?.userProfile as IUserInterface | undefined;

    // Set httpOnly cookie for secure token storage
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
    });

    res.status(200).json({
      message: "User logged in",
      data: {
        user: {
          _id: user._id,
          email: email,
          firstname: profile?.firstname,
          lastname: profile?.lastname,
          roles: profile?.roles,
          profilePicture: profile?.profilePicture?.url,
          isVerified: profile?.isVerified,
          isEmailVerified: populatedUser?.isEmailVerified ?? false,
        },
      },
      token,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
  }
};

// logout - clears the auth cookie
export const logoutUser = (_req: Request, res: Response) => {
  res.cookie("authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
  });

  res.status(200).json({ message: "User logged out successfully" });
};

//change password
export const changePassword = async (
  req: Request<IChangePassword>,
  res: Response,
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
    const resetUrl = `${frontendUrl}/auth/reset-password/${resetToken}`;

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

//check email
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    const emailExists = await userAuthModel.findOne({ email });
    if (!emailExists) {
      res.status(200).json({ message: "Email available" });
      return;
    } else {
      res
        .status(400)
        .json({ message: "Email already in use, please use something else" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An error occurred resetting password" });
    }
  }
};

// Verify email with token
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    // Hash the token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token that hasn't expired
    const user = await userAuthModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        error: "Invalid or expired verification token",
      });
      return;
    }

    // Mark as verified and clear token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully. You can now access all features.",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An error occurred verifying email" });
    }
  }
};

// Resend verification email
export const resendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  try {
    const user = await userAuthModel.findOne({ email });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      res.status(200).json({
        message:
          "If an account with that email exists and is not verified, a new verification email has been sent.",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        error: "This email is already verified. You can log in.",
      });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Update user with new token
    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationUrl = `${frontendUrl}/auth/verify-email/${verificationToken}`;

    await sendVerificationEmail(email, verificationUrl);

    res.status(200).json({
      message:
        "If an account with that email exists and is not verified, a new verification email has been sent.",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "An error occurred sending verification email" });
    }
  }
};
