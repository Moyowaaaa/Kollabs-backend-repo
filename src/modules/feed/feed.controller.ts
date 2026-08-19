import type { NextFunction, Response } from "express";
import { Types } from "mongoose";
import { IError } from "../../interfaces/error.interface";
import ProjectsModel from "../projects/projects.model";
import { CacheService } from "../../utils/cache.service";
import { AuthenticatedRequest } from "../auth/auth.interface";

// Cache TTL in seconds (5 minutes)
const FEED_CACHE_TTL = 300;

const PUBLIC_FEED_STATUSES = [
  "draft",
  "pending",
  "ongoing",
  "completed",
] as const;

const TRENDING_FEED_STATUSES = ["pending", "ongoing", "completed"] as const;

type ParsedFeedCursor = {
  createdAt?: Date;
  id: string;
};

/**
 * Encode a stable compound cursor from the last item in a page.
 * Format: `${createdAtMs}_${objectId}`
 */
export const encodeFeedCursor = (
  createdAt: Date | string,
  id: string,
): string => {
  const ms =
    createdAt instanceof Date
      ? createdAt.getTime()
      : new Date(createdAt).getTime();
  return `${ms}_${id}`;
};

/**
 * Parse compound cursors, with a fallback for legacy ObjectId-only cursors.
 */
export const parseFeedCursor = (
  cursor?: string,
): ParsedFeedCursor | null => {
  if (!cursor) return null;

  const separator = cursor.lastIndexOf("_");
  if (separator > 0) {
    const timestampPart = cursor.slice(0, separator);
    const id = cursor.slice(separator + 1);
    const createdAt = new Date(Number(timestampPart));

    if (
      !Number.isNaN(createdAt.getTime()) &&
      Types.ObjectId.isValid(id)
    ) {
      return { createdAt, id };
    }
  }

  if (Types.ObjectId.isValid(cursor)) {
    return { id: cursor };
  }

  return null;
};

const buildVisibilityFilter = () => ({
  status: { $in: [...PUBLIC_FEED_STATUSES] },
});

const buildCursorFilter = (parsed: ParsedFeedCursor): Record<string, unknown> => {
  if (parsed.createdAt) {
    const objectId = new Types.ObjectId(parsed.id);
    return {
      $or: [
        { createdAt: { $lt: parsed.createdAt } },
        {
          createdAt: parsed.createdAt,
          _id: { $lt: objectId },
        },
      ],
    };
  }

  // Legacy ObjectId-only cursor
  return { _id: { $lt: new Types.ObjectId(parsed.id) } };
};

/**
 * Get paginated feed of Ideas/Projects
 * Uses compound cursor pagination for infinite scroll
 * Results are cached in Redis for performance
 */
export const getFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cursor, limit = "20" } = req.query as {
      cursor?: string;
      limit?: string;
    };

    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    // v3: drafts are public (with UI flags); compound cursor
    const cacheKey = `feed:v3:${cursor || "initial"}:${limitNum}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    const filter: Record<string, unknown> = {
      $and: [buildVisibilityFilter()],
    };

    const parsedCursor = parseFeedCursor(cursor);
    if (parsedCursor) {
      (filter.$and as Record<string, unknown>[]).push(
        buildCursorFilter(parsedCursor),
      );
    }

    const projects = await ProjectsModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limitNum + 1)
      .populate({
        path: "author",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture roles bio",
        },
      })
      .populate({
        path: "collaborators",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture",
        },
      })
      .lean();

    const hasMore = projects.length > limitNum;
    const items = hasMore ? projects.slice(0, -1) : projects;
    const lastItem = items[items.length - 1] as
      | { _id: Types.ObjectId; createdAt: Date }
      | undefined;
    const nextCursor =
      hasMore && lastItem
        ? encodeFeedCursor(lastItem.createdAt, String(lastItem._id))
        : null;

    const response = {
      items,
      pagination: {
        nextCursor,
        hasMore,
        limit: limitNum,
      },
    };

    await CacheService.set(cacheKey, response, FEED_CACHE_TTL);

    return res.status(200).json({
      ...response,
      fromCache: false,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while fetching feed";
    return next(error);
  }
};

/**
 * Get trending Ideas (sorted by collaboration request count)
 */
export const getTrendingFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { limit = "20" } = req.query as { limit?: string };
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const cacheKey = `feed:trending:v2:${limitNum}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    const projects = await ProjectsModel.aggregate([
      {
        $match: {
          status: { $in: [...TRENDING_FEED_STATUSES] },
        },
      },
      {
        $lookup: {
          from: "collaborationrequests",
          localField: "_id",
          foreignField: "projectId",
          as: "requests",
        },
      },
      {
        $addFields: {
          acceptedRequestCount: {
            $size: {
              $filter: {
                input: "$requests",
                as: "req",
                cond: { $eq: ["$$req.status", "accepted"] },
              },
            },
          },
          totalRequestCount: { $size: "$requests" },
          collaboratorCount: { $size: "$collaborators" },
        },
      },
      {
        $sort: {
          collaboratorCount: -1,
          acceptedRequestCount: -1,
          totalRequestCount: -1,
          createdAt: -1,
        },
      },
      { $limit: limitNum },
      { $project: { requests: 0 } },
    ]);

    await ProjectsModel.populate(projects, [
      {
        path: "author",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture roles bio",
        },
      },
      {
        path: "collaborators",
        select: "email userProfile",
        populate: {
          path: "userProfile",
          select: "firstname lastname profilePicture",
        },
      },
    ]);

    const response = { items: projects, type: "trending" };

    await CacheService.set(cacheKey, response, 180);

    return res.status(200).json({
      ...response,
      fromCache: false,
    });
  } catch (err) {
    const error = err as IError;
    error.status = 500;
    error.message = "An error occurred while fetching trending feed";
    return next(error);
  }
};

/**
 * Invalidate all feed caches
 */
export const invalidateFeedCache = async (): Promise<void> => {
  await CacheService.invalidatePattern("feed:*");
};
