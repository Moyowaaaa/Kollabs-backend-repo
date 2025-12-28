import type { NextFunction, Request, Response } from "express";
import { IError } from "../interfaces/error.interface";

const ErrorLogger = (
  error: IError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Don't try to send a response if headers already sent
  if (res.headersSent) {
    return;
  }
  res
    .status(error.status || 500)
    .json({ message: error.message || "Server error" });
};

export default ErrorLogger;
