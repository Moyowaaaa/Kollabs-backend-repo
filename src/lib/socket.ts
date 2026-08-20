import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import userAuthModel from "../modules/auth/auth.model";
import ConversationModel from "../modules/chat/conversation.model";
import type { jwtToken } from "../middleware/authMiddleware";
import logger from "./log/winston.log";
import { allowedOrigins } from "./allowedOrigins";

type ChatSocketData = {
  userId: string;
};

type ClientToServerEvents = {
  "conversation:join": (
    payload: { conversationId?: string },
    ack?: (response: { ok: boolean; message?: string }) => void,
  ) => void;
  "conversation:leave": (payload: { conversationId?: string }) => void;
};

type ServerToClientEvents = {
  "chat:message": (payload: {
    conversationId: string;
    message: unknown;
  }) => void;
};

type ChatSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  ChatSocketData
>;

type ChatServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  ChatSocketData
>;

let io: ChatServer | null = null;

export const getIO = () => io;

const parseCookies = (cookieHeader?: string) => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join("="));
  }

  return cookies;
};

const getHandshakeToken = (socket: ChatSocket) => {
  const auth: unknown = socket.handshake.auth;
  if (typeof auth === "object" && auth !== null && "token" in auth) {
    const token: unknown = Reflect.get(auth, "token");
    if (typeof token === "string" && token.length > 0) return token;
  }

  const cookies = parseCookies(socket.handshake.headers.cookie);
  return cookies.authToken;
};

const conversationRoom = (conversationId: string) =>
  `conversation:${conversationId}`;

const userRoom = (userId: string) => `user:${userId}`;

const registerConnectionHandlers = (socket: ChatSocket) => {
  const userId = socket.data.userId;
  void socket.join(userRoom(userId));

  socket.on(
    "conversation:join",
    async (
      payload: { conversationId?: string } = {},
      ack?: (response: { ok: boolean; message?: string }) => void,
    ) => {
      const conversationId = payload.conversationId?.trim();

      if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
        ack?.({ ok: false, message: "A valid conversationId is required" });
        return;
      }

      const conversation = await ConversationModel.exists({
        _id: conversationId,
        participantIds: userId,
        members: {
          $elemMatch: {
            userId,
            leftAt: null,
          },
        },
      });

      if (!conversation) {
        ack?.({ ok: false, message: "Conversation not found" });
        return;
      }

      await socket.join(conversationRoom(conversationId));
      ack?.({ ok: true });
    },
  );

  socket.on(
    "conversation:leave",
    (payload: { conversationId?: string } = {}) => {
      const conversationId = payload.conversationId?.trim();
      if (!conversationId) return;
      void socket.leave(conversationRoom(conversationId));
    },
  );
};

const authenticateSocket = async (
  socket: ChatSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token = getHandshakeToken(socket);
    if (!token) {
      next(new Error("Authorization token required"));
      return;
    }

    const decoded = jwt.verify(token, process.env.SECRET as string) as jwtToken;
    const user = await userAuthModel.findById(decoded._id).select("_id");

    if (!user) {
      next(new Error("User not found"));
      return;
    }

    socket.data.userId = String(user._id);
    next();
  } catch {
    next(new Error("Request not authorized"));
  }
};

export const initSocket = (httpServer: HttpServer) => {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    ChatSocketData
  >(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    void authenticateSocket(socket, next);
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected ${socket.id}`);
    registerConnectionHandlers(socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected ${socket.id}`);
    });
  });

  return io;
};
