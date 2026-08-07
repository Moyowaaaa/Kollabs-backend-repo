import express from "express";
import type { Router, RequestHandler } from "express";
import { getFeed, getTrendingFeed } from "./feed.controller";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

// All feed routes require authentication
router.use(verifyAuthentication as express.RequestHandler);

/**
 * GET /v1/api/feed
 * Main chronological feed with cursor-based pagination
 * Query params:
 *   - cursor: compound cursor (`createdAtMs_objectId`) from last item
 *   - limit: Number of items per page (default: 20, max: 50)
 */
router.get("/", getFeed as RequestHandler);

/**
 * GET /v1/api/feed/trending
 * Trending Ideas sorted by engagement (collaboration requests)
 */
router.get("/trending", getTrendingFeed as RequestHandler);

export default router;
