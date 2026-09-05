import type { NextFunction, Response } from "express";
import type { FilterQuery } from "mongoose";
import { IError } from "../../interfaces/error.interface";
import { AuthenticatedRequest } from "../auth/auth.interface";
import ProjectsModel from "../projects/projects.model";
import type { IProjects } from "../projects/projects.interface";
import UserProfileModel from "../user/user.model";
import type { IUserInterface } from "../user/user.interface";
import {
  normalizeProjectStatus,
  PROJECT_PIPELINE_STATUSES,
} from "../projects/project-status";
// Ensure UserProfile is registered for populate
import "../user/user.model";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseList = (value?: string | string[]) => {
  const parts = Array.isArray(value) ? value : value ? [value] : [];
  return parts
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
};

const caseInsensitiveMatch = (value: string) =>
  new RegExp(escapeRegex(value), "i");

const tagFilters = <T>(
  field: "roles" | "requiredRoles",
  tags: string[],
): FilterQuery<T>[] =>
  tags.map((tag) => ({
    [field]: caseInsensitiveMatch(tag),
  })) as FilterQuery<T>[];

const normalizePhrase = (value: string) =>
  value.toLowerCase().replace(/[\s_-]+/g, " ").trim();

const STATUS_PHRASES: Record<string, (typeof PROJECT_PIPELINE_STATUSES)[number]> =
  {
    draft: "draft",
    drafts: "draft",
    ongoing: "ongoing",
    "in progress": "ongoing",
    completed: "completed",
    complete: "completed",
    done: "completed",
    finished: "completed",
    pending: "seeking_collaborators",
    seeking: "seeking_collaborators",
    "seeking collaborators": "seeking_collaborators",
    "seeking collaborator": "seeking_collaborators",
    recruiting: "seeking_collaborators",
    "looking for collaborators": "seeking_collaborators",
  };

const inferStatusFromQuery = (query: string) =>
  STATUS_PHRASES[normalizePhrase(query)] ?? "";

const statusClause = (status: string) =>
  status === "seeking_collaborators"
    ? { $in: ["seeking_collaborators", "pending"] }
    : status;

const mergeUnique = <T extends { _id: unknown }>(
  primary: T[],
  extra: T[],
  limit: number,
): T[] => {
  const seen = new Set(primary.map((item) => String(item._id)));
  const merged = [...primary];
  for (const item of extra) {
    if (merged.length >= limit) break;
    const id = String(item._id);
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(item);
  }
  return merged;
};

export const globalSearch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q, role, skill, status, limit = "6" } = req.query as {
      q?: string;
      role?: string | string[];
      skill?: string | string[];
      status?: string;
      limit?: string;
    };

    const query = (q ?? "").trim();
    const roles = parseList(role);
    const skills = parseList(skill);
    const tags = [...roles, ...skills];
    const inferredStatus = inferStatusFromQuery(query);
    const requestedStatus = status
      ? normalizeProjectStatus(status.trim())
      : "";
    const normalizedStatus = (
      PROJECT_PIPELINE_STATUSES as readonly string[]
    ).includes(requestedStatus)
      ? requestedStatus
      : inferredStatus;
    const hasValidStatus = (
      PROJECT_PIPELINE_STATUSES as readonly string[]
    ).includes(normalizedStatus);

    const hasKeyword = query.length >= 2;
    const hasUserFilters = hasKeyword || tags.length > 0;
    const hasProjectFilters = hasKeyword || tags.length > 0 || hasValidStatus;

    if (!hasUserFilters && !hasProjectFilters) {
      return res.status(200).json({
        query,
        filters: {
          role: roles[0] ?? null,
          skill: skills[0] ?? null,
          status: hasValidStatus ? normalizedStatus : null,
        },
        projects: [],
        users: [],
      });
    }

    const limitNum = Math.min(10, Math.max(1, parseInt(limit, 10) || 6));
    const activeStatus = hasValidStatus
      ? statusClause(normalizedStatus)
      : { $nin: ["deleted", "archived"] };

    const projectFilter: FilterQuery<IProjects> = {
      status: activeStatus,
    };
    const userFilter: FilterQuery<IUserInterface> = {};

    if (hasKeyword) {
      projectFilter.$text = { $search: query };
      userFilter.$text = { $search: query };
    }

    const projectTagFilters = tagFilters<IProjects>("requiredRoles", tags);
    if (projectTagFilters.length > 0) {
      projectFilter.$and = projectTagFilters;
    }

    const userTagFilters = tagFilters<IUserInterface>("roles", tags);
    if (userTagFilters.length > 0) {
      userFilter.$and = userTagFilters;
    }

    const projectProjection = hasKeyword
      ? { score: { $meta: "textScore" } }
      : {};
    const userProjection = hasKeyword ? { score: { $meta: "textScore" } } : {};

    const roleMatch = hasKeyword ? caseInsensitiveMatch(query) : null;
    const extraProjectFilter: FilterQuery<IProjects> = {
      status: activeStatus,
    };
    const extraUserFilter: FilterQuery<IUserInterface> = {};

    if (projectTagFilters.length > 0) {
      extraProjectFilter.$and = projectTagFilters;
    }
    if (userTagFilters.length > 0) {
      extraUserFilter.$and = userTagFilters;
    }

    if (roleMatch && !hasValidStatus) {
      extraProjectFilter.requiredRoles = roleMatch;
    }
    if (roleMatch) {
      extraUserFilter.roles = roleMatch;
    }

    const shouldQueryExtraProjects =
      hasProjectFilters && (hasValidStatus || Boolean(roleMatch));
    const shouldQueryExtraUsers = hasUserFilters && Boolean(roleMatch);

    const projectPopulate = {
      path: "author",
      select: "email userProfile",
      populate: {
        path: "userProfile",
        select: "firstname lastname profilePicture roles",
      },
    } as const;

    const [
      textProjects,
      extraProjects,
      textUsers,
      extraUsers,
    ] = await Promise.all([
      hasKeyword
        ? ProjectsModel.find(projectFilter, projectProjection)
            .sort({ score: { $meta: "textScore" } })
            .limit(limitNum)
            .select("title description status requiredRoles author createdAt")
            .populate(projectPopulate)
            .lean()
            .exec()
        : hasProjectFilters && !hasKeyword
          ? ProjectsModel.find(projectFilter)
              .sort({ createdAt: -1 })
              .limit(limitNum)
              .select("title description status requiredRoles author createdAt")
              .populate(projectPopulate)
              .lean()
              .exec()
          : Promise.resolve([]),

      shouldQueryExtraProjects && hasKeyword
        ? ProjectsModel.find(extraProjectFilter)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .select("title description status requiredRoles author createdAt")
            .populate(projectPopulate)
            .lean()
            .exec()
        : Promise.resolve([]),

      hasKeyword
        ? UserProfileModel.find(userFilter, userProjection)
            .sort({ score: { $meta: "textScore" } })
            .limit(limitNum)
            .select("authUser firstname lastname roles profilePicture bio")
            .lean()
            .exec()
        : hasUserFilters && !hasKeyword
          ? UserProfileModel.find(userFilter)
              .sort({ firstname: 1, lastname: 1 })
              .limit(limitNum)
              .select("authUser firstname lastname roles profilePicture bio")
              .lean()
              .exec()
          : Promise.resolve([]),

      shouldQueryExtraUsers
        ? UserProfileModel.find(extraUserFilter)
            .sort({ firstname: 1, lastname: 1 })
            .limit(limitNum)
            .select("authUser firstname lastname roles profilePicture bio")
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

    const projects = mergeUnique(textProjects, extraProjects, limitNum);
    const users = mergeUnique(textUsers, extraUsers, limitNum);

    return res.status(200).json({
      query,
      filters: {
        role: roles[0] ?? null,
        skill: skills[0] ?? null,
        status: hasValidStatus ? normalizedStatus : null,
      },
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
