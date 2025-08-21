import { NextFunction, Request, Response } from "express";

export const validateCreateTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type, amount, description } = req.body;

  if (!type && !amount && amount <= 0 && !description) {
    res.status(400).json({
      type: Error,
      name: "Bad request",
      message: "Incomplete transaction details.",
    });
  }

  next();
};
