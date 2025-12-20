import express from "express";
import type { Router } from "express";
import waitlistRoutes from "./waitlist.routes";

const router: Router = express.Router();

router.use("/", waitlistRoutes);

export default router;
