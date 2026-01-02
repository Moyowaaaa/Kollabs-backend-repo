import express from "express";
import type { Router } from "express";
import {
  deleteWaitlister,
  getWaitlisters,
  registerForWaitlist,
} from "./waitlist.controller";
import verifyAuthentication from "../../middleware/authMiddleware";
import { waitlistLimiter } from "../../middleware/rateLimiter";

const router = express.Router() as Router;

// Public route - register for waitlist (rate limited)
router.post("/waitlist", waitlistLimiter, registerForWaitlist);

// Protected routes - require authentication
router.get(
  "/waitlist",
  verifyAuthentication as express.RequestHandler,
  getWaitlisters
);
router.delete(
  "/waitlist/:id",
  verifyAuthentication as express.RequestHandler,
  deleteWaitlister
);

export default router;
