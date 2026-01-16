import type { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  AuthenticatedRequest,
  IUserAuth,
} from "../modules/auth/auth.interface";
import userAuthModel from "../modules/auth/auth.model";

export interface jwtToken extends JwtPayload {
  _id: string;
}

const verifyAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Try to get token from httpOnly cookie first, then from Authorization header
  let token: string | undefined;

  // Check for token in cookies (set by login endpoint)
  const cookies = req.cookies as { authToken?: string } | undefined;
  if (cookies?.authToken) {
    token = cookies.authToken;
  }
  // Fallback to Authorization header (for non-browser clients like mobile apps or Postman)
  else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

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
    res.status(401).json({ message: "Request not authorized", error });
    return;
  }
};

export default verifyAuthentication;
