/**
 * @swagger
 * /v1/api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project with title, description, and optional media uploads
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: Project title
 *                 example: My Awesome Project
 *               description:
 *                 type: string
 *                 description: Project description
 *                 example: This is a collaborative project for building innovative solutions
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional media files (images, documents) for the project
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project created successfully
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Authorization token required
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
 * /v1/api/projects/{projectId}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by its ID. Also deletes associated media from Cloudinary.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Authorization token required
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Project ID
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           description: Project title
 *           example: My Awesome Project
 *         description:
 *           type: string
 *           description: Project description
 *           example: This is a collaborative project for building innovative solutions
 *         author:
 *           type: string
 *           description: User ID of the project author
 *           example: 507f1f77bcf86cd799439012
 *         collaborators:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of collaborator user IDs
 *           example: []
 *         status:
 *           type: string
 *           enum: [draft, pending, ongoing, completed, deleted]
 *           description: Current status of the project
 *           example: draft
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Cloudinary URL of the media
 *                 example: https://res.cloudinary.com/example/image/upload/v1234567890/projects_media/abc123.jpg
 *               id:
 *                 type: string
 *                 description: Cloudinary public ID
 *                 example: projects_media/abc123
 *           description: Array of media files associated with the project
 *         conversationId:
 *           type: string
 *           description: Optional conversation ID for project discussions
 *           example: conv_507f1f77bcf86cd799439013
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the project was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the project was last updated
 *     ProjectMedia:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Cloudinary URL of the media file
 *         id:
 *           type: string
 *           description: Cloudinary public ID for the media file
 */
