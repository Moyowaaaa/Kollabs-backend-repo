import express from "express";
import type { Router } from "express";
import { registerForWaitlist } from "../../controllers/waitlist/waitlist.controller";

const router = express.Router() as Router;

router.post("/waitlist", registerForWaitlist);

export default router;
