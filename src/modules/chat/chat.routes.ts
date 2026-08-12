import express from "express";
import type { Router, RequestHandler } from "express";
import verifyAuthentication from "../../middleware/authMiddleware";
import {
  createDMConversation,
  createGroupConversation,
  createKollaboration,
  getConversationMessages,
  getUserConversation,
  getUserConversations,
  SendMessage,
  votePoll,
} from "./chat.controller";
import { groupAvatarUpload } from "../../utils/multer";

const router = express.Router() as Router;

router.use(verifyAuthentication as express.RequestHandler);

// GET /v1/api/chat/conversations?type=dm|group|kollaboration&page=1&limit=15
router.get("/conversations", getUserConversations as RequestHandler);

//GET /v1/api/chat/conversations/:conversationId - Get a single user conversation
router.get(
  "/conversations/:conversationId",
  getUserConversation as RequestHandler,
);

//GET /v1/api/chat/conversations/:conversationId/messages
router.get(
  "/conversations/:conversationId/messages",
  getConversationMessages as RequestHandler,
);

//POST /v1/api/chat/dms - Create a dm conversation
router.post("/dms", createDMConversation as RequestHandler);

//POST /v1/api/chat/conversations/:conversationId/messages
router.post(
  "/conversations/:conversationId/messages",
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
