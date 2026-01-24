import type { NextFunction, Response } from "express";
import { IError } from "../../interfaces/error.interface";
import ProjectsModel from "../projects/projects.model";
import { CacheService } from "../../utils/cache.service";
import { AuthenticatedRequest } from "../auth/auth.interface";

// Cache TTL in seconds (5 minutes)
const FEED_CACHE_TTL = 300;

/**
 * Get paginated feed of Ideas/Projects
 * Uses cursor-based pagination for infinite scroll
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
    const cacheKey = `feed:${cursor || "initial"}:${limitNum}`;

    // Try cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    // Build query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      status: { $nin: ["deleted", "archived"] },
    };

    // Cursor-based pagination: get items older than cursor
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    // Query with population (limit + 1 to check if more exist)
    const projects = await ProjectsModel.find(filter)
      .sort({ createdAt: -1 })
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

    // Check if there are more items
    const hasMore = projects.length > limitNum;
    const items = hasMore ? projects.slice(0, -1) : projects;
    const nextCursor = hasMore ? String(items[items.length - 1]._id) : null;

    const response = {
      items,
      pagination: {
        nextCursor,
        hasMore,
        limit: limitNum,
      },
    };

    // Cache the response
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
    const cacheKey = `feed:trending:${limitNum}`;

    // Try cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fromCache: true,
      });
    }

    // Aggregate to count collaboration requests and sort by team activity
    const projects = await ProjectsModel.aggregate([
      { $match: { status: { $nin: ["deleted", "archived"] } } },
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
          // Count only accepted requests for better trending signal
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
      // Sort by: collaborators first (actual team), then accepted requests, then total interest
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

    // Populate author and collaborators
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

    // Cache trending (shorter TTL - 3 minutes)
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
