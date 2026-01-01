import express, { Router } from "express";
import authRoutes from "./auth.routes";

const router = express.Router() as Router;

router.use("/", authRoutes);

export default router;
