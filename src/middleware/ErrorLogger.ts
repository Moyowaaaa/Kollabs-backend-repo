import type { NextFunction, Request, Response } from "express";
import { IError } from "../interfaces/error.interface";

const ErrorLogger = (
  error: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(error.status || 500).json(error.message || `Server error`);
};

export default ErrorLogger;
