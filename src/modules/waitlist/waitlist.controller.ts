import { NextFunction, Request, Response } from "express";
import { IWaitlisterInterface } from "./waitlist.interface";
import WaitlisterModel from "./waitlist.model";
import { IError } from "../../interfaces/error.interface";
import { sendWaitlistConfirmation } from "../../utils/email.service";

export const registerForWaitlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body as IWaitlisterInterface;

    const isExisting = await WaitlisterModel.findOne({ email });
    if (isExisting) {
      return res
        .status(400)
        .json({ message: "User already registered for waitlist" });
    }

    await WaitlisterModel.create(req.body);

    // Send confirmation email (fire-and-forget, don't block response)
    sendWaitlistConfirmation(email).catch((emailError) => {
      console.error("Failed to send confirmation email:", emailError);
    });

    res.status(201).json({ message: "User added to waitlist" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred";
    return next(error);
  }
};

export const getWaitlisters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      const waitlisters = await WaitlisterModel.find().limit(limit);
      return res.status(200).json({ message: "Waitlisters", waitlisters });
    }

    const waitlisters = await WaitlisterModel.find();
    return res.status(200).json({ message: "Waitlisters", waitlisters });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred";
    return next(error);
  }
};

export const deleteWaitlister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const waitlisterId = req.params.id;
    if (!waitlisterId) {
      res.status(422).json({ message: "Please provide a valid id" });
      return;
    }
    const waitlister = await WaitlisterModel.findById(waitlisterId);
    if (!waitlister) {
      res.status(422).json({ message: "No waitlister found with this id" });
      return;
    }
    await waitlister.deleteOne({ waitlisterId });
    return res.status(200).json({ message: "Waitlister deleted successfully" });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred";
    return next(error);
  }
};
