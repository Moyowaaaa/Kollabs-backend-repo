import express from "express";
import type { Router } from "express";
import {
  deleteWaitlister,
  getWaitlisters,
  registerForWaitlist,
} from "../../controllers/waitlist.controller";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

//register for waitlist
router.post("/waitlist", registerForWaitlist);

router.use(verifyAuthentication as express.RequestHandler);

//get waitlisters
router.get("/waitlist", getWaitlisters);

//delete waitlister
router.delete("/waitlist/:id", deleteWaitlister);

export default router;
