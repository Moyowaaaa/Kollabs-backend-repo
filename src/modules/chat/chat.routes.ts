import express from "express";
import type { Router, RequestHandler } from "express";
import verifyAuthentication from "../../middleware/authMiddleware";
import {
  createDMConversation,
  createGroupConversation,
  createKollaboration,
  getConversationMessages,
  getRecentMessages,
  getUserConversation,
  getUserConversations,
  markConversationAsRead,
  SendMessage,
  votePoll,
} from "./chat.controller";
import { chatAttachmentsUpload, groupAvatarUpload } from "../../utils/multer";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// GET /v1/api/chat/conversations?type=dm|group|kollaboration&page=1&limit=15
router.get("/conversations", getUserConversations as RequestHandler);

// GET /v1/api/chat/messages/recent?limit=5 - Dashboard recent messages
router.get("/messages/recent", getRecentMessages as RequestHandler);

//GET /v1/api/chat/conversations/:conversationId - Get a single user conversation
router.get(
  "/conversations/:conversationId",
  getUserConversation as RequestHandler,
);

// PATCH /v1/api/chat/conversations/:conversationId/read - Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  markConversationAsRead as RequestHandler,
);

//GET /v1/api/chat/conversations/:conversationId/messages
router.get(
  "/conversations/:conversationId/messages",
  getConversationMessages as RequestHandler,
);

//POST /v1/api/chat/dms - Create a dm conversation
router.post("/dms", createDMConversation as RequestHandler);

//POST /v1/api/chat/conversations/:conversationId/messages
// Supports JSON body or multipart with up to 4 `attachments` files
router.post(
  "/conversations/:conversationId/messages",
  chatAttachmentsUpload as unknown as RequestHandler,
  SendMessage as RequestHandler,
);

//POST /v1/api/chat/messages/:messageId/poll/vote
router.post(
  "/messages/:messageId/poll/vote",
  votePoll as RequestHandler,
);

//POST /v1/api/chat/group-conversations - Create a group (optional avatar upload)
router.post(
  "/group-conversations",
  groupAvatarUpload as unknown as RequestHandler,
  createGroupConversation as RequestHandler,
);

//POST /v1/api/chat/kollaborations
router.post("/kollaborations", createKollaboration as RequestHandler);

export default router;
