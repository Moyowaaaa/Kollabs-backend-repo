/**
 * @swagger
 * /socket.io:
 *   get:
 *     summary: Socket.IO realtime chat connection
 *     description: |
 *       Realtime layer for chat. REST is still the source of truth for sending
 *       messages (`POST /v1/api/chat/conversations/{conversationId}/messages`).
 *       After a message is persisted, the server broadcasts it over Socket.IO.
 *
 *       **Connect** to the same HTTP origin as the API (development:
 *       `http://localhost:4000`). The Socket.IO path is `/socket.io`.
 *
 *       **Auth** (one of):
 *       - Cookie `authToken` (browser clients with credentials)
 *       - Handshake `auth.token` = JWT (Postman, mobile, non-browser)
 *
 *       On connect the socket joins personal room `user:{userId}`.
 *
 *       **Client → server events**
 *       - `conversation:join` `{ conversationId }` — membership-checked join of
 *         `conversation:{id}`. Optional ack `{ ok, message? }`.
 *       - `conversation:leave` `{ conversationId }` — leave that room.
 *
 *       **Server → client events**
 *       - `chat:message` `{ conversationId, message }` — emitted to
 *         `conversation:{conversationId}` after a successful REST send.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       101:
 *         description: WebSocket upgrade (Socket.IO handshake). Not a REST JSON response.
 *       401:
 *         description: Missing or invalid JWT (`Authorization token required` / `Request not authorized`)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SocketChatMessageEvent:
 *       type: object
 *       description: Payload of the Socket.IO `chat:message` event
 *       properties:
 *         conversationId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         message:
 *           type: object
 *           description: Persisted message document (text, attachment, poll, or system)
 *     SocketConversationJoinPayload:
 *       type: object
 *       required:
 *         - conversationId
 *       properties:
 *         conversationId:
 *           type: string
 */
