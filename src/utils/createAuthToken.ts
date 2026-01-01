import jwt from "jsonwebtoken";

export const createAuthToken = (_id: string) => {
  const secret = process.env.SECRET;
  if (!secret) {
    throw new Error("JWT secret not defined in environmental variables");
  }

  return jwt.sign({ _id }, secret, { expiresIn: "2d" });
};
