import express from "express";
import type { Router, RequestHandler } from "express";
import verifyAuthentication from "../../middleware/authMiddleware";
import { globalSearch } from "./search.controller";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// GET /v1/api/search?q=&role=&skill=&status=&limit=
router.get("/", globalSearch as RequestHandler);

export default router;