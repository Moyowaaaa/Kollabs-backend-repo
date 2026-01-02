import type { Request } from "express";
import mongoose, { Model } from "mongoose";
import { IUserLinks } from "../user/user.interface";

export interface IUserAuth {
  email: string;
  password: string;
  _id: string;
  userProfile?: mongoose.Types.ObjectId;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export interface AuthenticatedRequest extends Request {
  user: IUserAuth;
}

export interface IUserAuthModel extends Model<IUserAuth> {
  changePassword(
    email: string,
    newPassword: string,
    comparePassword: string
  ): Promise<IUserAuth>;
  signUpUser(email: string, password: string): Promise<IUserAuth>;
  loginUser(email: string, password: string): Promise<IUserAuth>;
}

export interface IChangePassword {
  email: string;
  newPassword: string;
  comparePassword: string;
}

// Complete signup request with profile data
export interface ISignupRequest {
  // Auth data
  email: string;
  password: string;
  // Profile data
  firstname: string;
  lastname: string;
  roles: string[];
  bio?: string;
  links?: IUserLinks;
}

// Forgot password request
export interface IForgotPasswordRequest {
  email: string;
}

// Reset password request
export interface IResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}
