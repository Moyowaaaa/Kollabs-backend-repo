import express, { Router } from "express";
import {
  changePassword,
  loginUser,
  signUpUser,
} from "../../controllers/user.auth.controller";

const router = express.Router() as Router;

router.post("/sign-in", loginUser);
router.post("/sign-up", signUpUser);
router.post("/reset-password", changePassword);

export default router;
