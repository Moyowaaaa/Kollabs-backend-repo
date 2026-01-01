import type { Request, Response } from "express";
import userAuthModel from "../models/user.auth.model";
import { createAuthToken } from "../utils/createAuthToken";

//signup
export const signUpUser = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await userAuthModel.signUpUser(email, password);
    const token = createAuthToken(user._id);
    res.status(200).json({ message: "User Successfully Signed up", token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
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
