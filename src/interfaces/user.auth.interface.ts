import type { Request } from "express";
import { Model } from "mongoose";

export interface IUserAuth {
  email: string;
  password: string;
  _id: string;
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
