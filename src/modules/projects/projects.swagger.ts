/**
 * @swagger
 * /v1/api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project with title, description, teamSize and optional media uploads
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
 *               teamSize:
 *                 type: number
 *                 description: Number of team members for the project
 *                 example: 3
 *               requiredRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Roles/skills needed for the project
 *                 example: ["UI/UX Designer", "Frontend Developer"]
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional media files (images) for the project (max 10 files)
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
 *   get:
 *     summary: Get user's projects
 *     description: Get all projects created by the authenticated user with pagination. Deleted and archived projects are excluded.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of user's projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
 * /v1/api/projects/project-feed:
 *   get:
 *     summary: Get all projects (feed)
 *     description: Get all projects from all users with pagination. Author info is populated. Deleted and archived projects are excluded.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectWithAuthor'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
 *   get:
 *     summary: Get a single project by ID
 *     description: Get project details by ID. Deleted and archived projects are not accessible.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to retrieve
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found (includes deleted/archived projects)
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
 *   put:
 *     summary: Full update a project
 *     description: Fully update an existing project by its ID. Replaces all fields. Only the project author can update.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to update
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated project title
 *                 example: My Updated Project
 *               description:
 *                 type: string
 *                 description: Updated project description
 *                 example: This is the updated description for my project
 *               teamSize:
 *                 type: number
 *                 description: Number of team members for the project
 *                 example: 5
 *               requiredRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated roles/skills needed
 *                 example: ["Backend Developer", "DevOps"]
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New media files to replace existing media (if not provided, existing media is preserved)
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project updated successfully
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Authorization token required or unauthorized
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
 *   patch:
 *     summary: Partial update a project
 *     description: Partially update a project. Only provided fields are updated, others remain unchanged. Cannot update deleted projects.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to update
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated project title (optional)
 *                 example: My Updated Project
 *               description:
 *                 type: string
 *                 description: Updated project description (optional)
 *                 example: This is the updated description
 *               teamSize:
 *                 type: number
 *                 description: Number of team members (optional)
 *                 example: 5
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New media files (optional, only updates if provided)
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project updated successfully
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Cannot update deleted project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authorization token required or unauthorized
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
 *   delete:
 *     summary: Delete a project (soft delete)
 *     description: Soft delete a project by setting its status to 'deleted'. Only the project author can delete.
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
 *         description: Authorization token required or unauthorized
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
 * /v1/api/projects/{projectId}/archive:
 *   patch:
 *     summary: Archive a project
 *     description: Archive a project by setting its status to 'archived'. Only the project author can archive.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to archive
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Project archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project archived successfully
 *       401:
 *         description: Authorization token required or unauthorized
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
 * /v1/api/projects/{projectId}/status:
 *   patch:
 *     summary: Update project status
 *     description: |
 *       Update the status of a project. Only the project author can change status.
 *       Cannot change status of deleted or archived projects.
 *     tags: [Projects]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending, ongoing, completed]
 *                 description: New status for the project
 *                 example: ongoing
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project status updated to ongoing
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid status or cannot change status of deleted/archived project
 *       401:
 *         description: Authorization token required or unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/api/projects/search:
 *   get:
 *     summary: Search projects
 *     description: Search projects/ideas with text search and filters. Uses MongoDB text index.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Text search query (searches title, description, and required roles)
 *         example: mobile app design
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, ongoing, completed]
 *         description: Filter by project status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectWithAuthor'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Authorization token required
 *       500:
 *         description: Internal server error
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
 *           enum: [draft, pending, ongoing, completed, deleted, archived]
 *           description: Current status of the project
 *           example: draft
 *         teamSize:
 *           type: number
 *           description: Number of team members for the project
 *           example: 1
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMedia'
 *           description: Array of media files associated with the project
 *         conversationId:
 *           type: string
 *           nullable: true
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
 *         requiredRoles:
 *           type: array
 *           items:
 *             type: string
 *           description: Roles/skills needed for the project
 *           example: ["UI/UX Designer", "Frontend Developer"]
 *     ProjectWithAuthor:
 *       allOf:
 *         - $ref: '#/components/schemas/Project'
 *         - type: object
 *           properties:
 *             author:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439012
 *                 fullName:
 *                   type: string
 *                   example: John Doe
 *                 profilePhoto:
 *                   type: string
 *                   example: https://res.cloudinary.com/example/image/upload/profile.jpg
 *     ProjectMedia:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Cloudinary URL of the media file
 *           example: https://res.cloudinary.com/example/image/upload/v1234567890/projects_media/abc123.jpg
 *         id:
 *           type: string
 *           description: Cloudinary public ID for the media file
 *           example: projects_media/abc123
 *     Pagination:
 *       type: object
 *       properties:
 *         totalProjects:
 *           type: integer
 *           description: Total number of projects
 *           example: 25
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           example: 3
 *         currentPage:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         itemsPerPage:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Project deleted successfully
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: An error occurred
 */
