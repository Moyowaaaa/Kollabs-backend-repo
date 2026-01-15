/**
 * @swagger
 * /v1/api/collaboration-requests/projects/{projectId}/requests:
 *   post:
 *     summary: Submit a collaboration request
 *     description: Submit a request to collaborate on an ongoing project. Includes proposal text and optional media.
 *     tags: [Collaboration Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to request collaboration on
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - proposal
 *             properties:
 *               proposal:
 *                 type: string
 *                 description: Why you want to collaborate on this project
 *                 example: I have experience in React and would love to contribute to the frontend.
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional supporting media (portfolio, previous work, etc.)
 *     responses:
 *       201:
 *         description: Collaboration request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Collaboration request submitted successfully
 *                 request:
 *                   $ref: '#/components/schemas/CollaborationRequest'
 *       400:
 *         description: Validation error (not ongoing project, already requested, team full, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authorization token required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get collaboration requests for a project
 *     description: Get all collaboration requests for a project. Only the project author can access this.
 *     tags: [Collaboration Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: List of collaboration requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollaborationRequestWithRequester'
 *       403:
 *         description: Only the project author can view collaboration requests
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/api/collaboration-requests/my-requests:
 *   get:
 *     summary: Get my sent collaboration requests
 *     description: Get all collaboration requests sent by the authenticated user.
 *     tags: [Collaboration Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's collaboration requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollaborationRequestWithProject'
 *       401:
 *         description: Authorization token required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/api/collaboration-requests/{requestId}/accept:
 *   patch:
 *     summary: Accept a collaboration request
 *     description: Accept a pending collaboration request. Only the project author can accept. Adds requester to collaborators.
 *     tags: [Collaboration Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the collaboration request
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Collaboration request accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Collaboration request accepted successfully
 *       400:
 *         description: Request already processed or team full
 *       403:
 *         description: Only the project author can accept requests
 *       404:
 *         description: Request or project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/api/collaboration-requests/{requestId}/reject:
 *   patch:
 *     summary: Reject a collaboration request
 *     description: Reject a pending collaboration request. Only the project author can reject.
 *     tags: [Collaboration Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the collaboration request
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Collaboration request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Collaboration request rejected
 *       400:
 *         description: Request already processed
 *       403:
 *         description: Only the project author can reject requests
 *       404:
 *         description: Request or project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CollaborationRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Request ID
 *           example: 507f1f77bcf86cd799439011
 *         projectId:
 *           type: string
 *           description: Project ID
 *           example: 507f1f77bcf86cd799439012
 *         requesterId:
 *           type: string
 *           description: User ID of requester
 *           example: 507f1f77bcf86cd799439013
 *         proposal:
 *           type: string
 *           description: Collaboration proposal text
 *           example: I have experience in React and would love to contribute.
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               id:
 *                 type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CollaborationRequestWithRequester:
 *       allOf:
 *         - $ref: '#/components/schemas/CollaborationRequest'
 *         - type: object
 *           properties:
 *             requesterId:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 profilePhoto:
 *                   type: string
 *                 email:
 *                   type: string
 *     CollaborationRequestWithProject:
 *       allOf:
 *         - $ref: '#/components/schemas/CollaborationRequest'
 *         - type: object
 *           properties:
 *             projectId:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 */
