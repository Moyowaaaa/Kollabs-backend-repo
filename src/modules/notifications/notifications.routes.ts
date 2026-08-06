import express from "express";
import type { Router, RequestHandler } from "express";
import verifyAuthentication from "../../middleware/authMiddleware";
import {
  createTestNotification,
  deleteUserNotification,
  getSingleNotification,
  getUnreadNotificationCount,
  getUserNotifications,
  markUserNotificationAsRead,
} from "./notifications.controller";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

//POST /v1/api/notifications - Create Test notification
router.post("/test-notification", createTestNotification as RequestHandler);

// GET /v1/api/notifications - Get users notifications
router.get("/", getUserNotifications as RequestHandler);

// GET /v1/api/notifications/unread-count - Get user unread notification count  
router.get("/unread-count", getUnreadNotificationCount as RequestHandler);


// GET /v1/api/notifications/:notificationId - Get single user notification
router.get("/:notificationId", getSingleNotification as RequestHandler);

// PATCH /v1/api/notifications/:notificationId - Mark a notification as read
router.patch("/:notificationId", markUserNotificationAsRead as RequestHandler);

// DELETE /v1/api/notifications/:notificationId - Delete a notification (soft delete)
router.delete("/:notificationId", deleteUserNotification as RequestHandler);

export default router;
