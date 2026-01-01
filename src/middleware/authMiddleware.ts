import type { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  AuthenticatedRequest,
  IUserAuth,
} from "../interfaces/user.auth.interface";
import userAuthModel from "../models/user.auth.model";

export interface jwtToken extends JwtPayload {
  _id: string;
}

const verifyAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  const token = authorization.split(" ")[1];

  try {
    // Type assertion to specify the expected JWT payload structure
    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const { _id } = decoded;

    // Find user and handle potential null return
    const user = await userAuthModel.findOne({ _id }).select("_id");

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Type assertion since we know the structure after verification
    req.user = user as IUserAuth;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Request not authorized" });
    return;
  }
};

export default verifyAuthentication;
