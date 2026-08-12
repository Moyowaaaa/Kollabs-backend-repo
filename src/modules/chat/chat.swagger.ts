/**
 * @swagger
 * /v1/api/chat/conversations:
 *   get:
 *     summary: List my conversations
 *     description: >
 *       Returns paginated conversations the authenticated user participates in
 *       and has not left. Optionally filter by conversation type.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [dm, group, kollaboration]
 *         description: Optional conversation type filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 15
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalConversations:
 *                       type: integer
 *                       example: 12
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Invalid type query value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get a single conversation
 *     description: >
 *       Returns one conversation if the authenticated user is an active
 *       participant (present in participantIds and members.leftAt is null).
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Conversation found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Conversation found
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid conversationId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Conversation not found or user is not a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/chat/dms:
 *   post:
 *     summary: Create or get a DM conversation
 *     description: >
 *       Idempotent. Creates a 1:1 DM with the recipient, or returns the existing
 *       conversation for that user pair (dmKey uniqueness).
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: User ID of the person to DM
 *                 example: 665f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: DM already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: DM conversation already exists
 *                 created:
 *                   type: boolean
 *                   example: false
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       201:
 *         description: DM created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: DM conversation created successfully
 *                 created:
 *                   type: boolean
 *                   example: true
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Validation error (missing/invalid recipient, self-DM)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/chat/group-conversations:
 *   post:
 *     summary: Create a group conversation
 *     description: >
 *       Creates a named group chat. Creator becomes owner. Optional avatar image
 *       uploads to Cloudinary (field name `avatar`).
 *       `memberIds` may be a JSON array string when using multipart form-data.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - memberIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: Design crew
 *               memberIds:
 *                 type: string
 *                 description: JSON array string of user IDs, or comma-separated IDs
 *                 example: '["665f1a2b3c4d5e6f7a8b9c0d","665f1a2b3c4d5e6f7a8b9c0e"]'
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Optional group avatar image
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - memberIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: Design crew
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["665f1a2b3c4d5e6f7a8b9c0d"]
 *               avatar:
 *                 type: object
 *                 description: Optional pre-uploaded avatar (prefer multipart file upload)
 *                 properties:
 *                   url:
 *                     type: string
 *                   id:
 *                     type: string
 *     responses:
 *       201:
 *         description: Group conversation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group conversation created successfully
 *                 created:
 *                   type: boolean
 *                   example: true
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: One or more members not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/chat/kollaborations:
 *   post:
 *     summary: Create or get a project Kollaboration chat
 *     description: >
 *       Idempotent. Creates a project-linked group chat for an ongoing project,
 *       or returns the existing one. Members are derived from project author +
 *       collaborators. Only the project author can create. Sets project.conversationId.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Ongoing project ID
 *                 example: 665f1a2b3c4d5e6f7a8b9c0f
 *     responses:
 *       200:
 *         description: Kollaboration already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kollaboration on this project already exists
 *                 created:
 *                   type: boolean
 *                   example: false
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       201:
 *         description: Kollaboration created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kollaboration started for this project
 *                 created:
 *                   type: boolean
 *                   example: true
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Validation error or project not ongoing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Only the project author can start a Kollaboration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
