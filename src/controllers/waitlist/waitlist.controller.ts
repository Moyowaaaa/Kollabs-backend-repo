import { NextFunction, Request, Response } from "express";
import { IWaitlisterInterface } from "../../interfaces/waitlister.interface";

import WaitlisterModel from "../../models/waitlist.model";
import { IError } from "../../interfaces/error.interface";

export const registerForWaitlist = async (
  req: Request<IWaitlisterInterface>,
  res: Response,
  next: NextFunction
) => {
  try {
    const isExisting = await WaitlisterModel.findOne({
      email: (req.body as IWaitlisterInterface).email,
    });
    if (isExisting) {
      return res
        .status(400)
        .json({ message: "User already registered for waitlist" });
    }
    await WaitlisterModel.create(req.body);
    res.status(201).json({ message: "User added to waitlist" });
  } catch (err) {
    const error = err as IError;
    error.status = 404;
    error.message = "An error occurred";
    return next(error);
  }
};
