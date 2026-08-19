import type { NextFunction, Response } from "express";
import { IError } from "../../interfaces/error.interface";
import { AuthenticatedRequest } from "../auth/auth.interface";
import ProjectsModel from "../projects/projects.model";
import UserProfileModel from "../user/user.model";
// Ensure UserProfile is registered for populate
import "../user/user.model";

export const globalSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q, limit = "6" } = req.query as {
      q?: string;
      limit?: string;
    };

    const query = (q ?? "").trim();

    if (query.length < 2) {
      return res.status(200).json({
        query,
        projects: [],
        users: [],
      });
    }

    const limitNum = Math.min(10, Math.max(1, parseInt(limit, 10) || 6));

    const projectFilter = {
      status: { $nin: ["deleted", "archived"] },
      $text: { $search: query },
    };

    const userFilter = {
      $text: { $search: query },
    };

    const [projects, users] = await Promise.all([
      ProjectsModel.find(projectFilter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(limitNum)
        .select("title description status requiredRoles author createdAt")
        .populate({
          path: "author",
          select: "email userProfile",
          populate: {
            path: "userProfile",
            select: "firstname lastname profilePicture roles",
          },
        })
        .lean()
        .exec(),

      UserProfileModel.find(userFilter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(limitNum)
        .select("authUser firstname lastname roles profilePicture bio")
        .lean()
        .exec(),
    ]);

    return res.status(200).json({
      query,
      projects,
      users: users.map((user) => ({
        _id: user._id,
        authUserId: user.authUser,
        firstname: user.firstname,
        lastname: user.lastname,
        roles: user.roles,
        profilePicture: user.profilePicture ?? null,
        bio: user.bio ?? null,
      })),
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while searching";
    return next(error);
  }
};
