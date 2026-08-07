/**
 * @swagger
 * /v1/api/feed:
 *   get:
 *     summary: Get main feed
 *     description: |
 *       Get paginated feed of Ideas/Projects with compound cursor pagination for infinite scroll.
 *       Public statuses (draft/pending/ongoing/completed) are visible to everyone.
 *       Draft ideas appear with a draft / not-active flag on the client; interest actions stay disabled until activated.
 *       Results are cached in Redis for performance. Deleted and archived projects are excluded.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Compound cursor from the previous page (`createdAtMs_objectId`). Omit for the first page.
 *         example: 1735689600000_507f1f77bcf86cd799439011
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Feed items with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/CursorPagination'
 *                 fromCache:
 *                   type: boolean
 *                   description: Whether the response was served from Redis cache
 *                   example: true
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
 * /v1/api/feed/trending:
 *   get:
 *     summary: Get trending Ideas
 *     description: |
 *       Get trending Ideas sorted by team activity. Ranking is based on:
 *       1. Collaborator count (actual team size) - highest priority
 *       2. Accepted collaboration requests
 *       3. Total collaboration requests (overall interest)
 *       4. Creation date (newer first as tiebreaker)
 *
 *       Results are cached for 3 minutes.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of trending items to return
 *     responses:
 *       200:
 *         description: Trending Ideas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrendingFeedItem'
 *                 type:
 *                   type: string
 *                   example: trending
 *                 fromCache:
 *                   type: boolean
 *                   description: Whether the response was served from Redis cache
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
 * components:
 *   schemas:
 *     FeedItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Project ID
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           description: Project title
 *           example: An anime mobile app
 *         description:
 *           type: string
 *           description: Project description
 *           example: A subscription box service that delivers unique, locally-sourced snacks
 *         requiredRoles:
 *           type: array
 *           items:
 *             type: string
 *           description: Roles/skills needed for the project
 *           example: ["UI/UX Designer", "Frontend", "Web designer"]
 *         author:
 *           $ref: '#/components/schemas/PopulatedAuthor'
 *         collaborators:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PopulatedCollaborator'
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMedia'
 *         status:
 *           type: string
 *           enum: [draft, pending, ongoing, completed]
 *           example: ongoing
 *         teamSize:
 *           type: integer
 *           description: Maximum team size
 *           example: 4
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TrendingFeedItem:
 *       allOf:
 *         - $ref: '#/components/schemas/FeedItem'
 *         - type: object
 *           properties:
 *             collaboratorCount:
 *               type: integer
 *               description: Number of current collaborators
 *               example: 3
 *             acceptedRequestCount:
 *               type: integer
 *               description: Number of accepted collaboration requests
 *               example: 3
 *             totalRequestCount:
 *               type: integer
 *               description: Total collaboration requests received
 *               example: 7
 *     PopulatedAuthor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         email:
 *           type: string
 *           example: author@example.com
 *         userProfile:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *               example: Anita
 *             lastname:
 *               type: string
 *               example: Baker
 *             profilePicture:
 *               type: string
 *               example: https://res.cloudinary.com/example/image/upload/profile.jpg
 *             roles:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Designer", "Developer"]
 *             bio:
 *               type: string
 *               example: Creative designer with 5 years of experience
 *     PopulatedCollaborator:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439013
 *         email:
 *           type: string
 *           example: collaborator@example.com
 *         userProfile:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *               example: John
 *             lastname:
 *               type: string
 *               example: Doe
 *             profilePicture:
 *               type: string
 *               example: https://res.cloudinary.com/example/image/upload/collab.jpg
 *     CursorPagination:
 *       type: object
 *       properties:
 *         nextCursor:
 *           type: string
 *           nullable: true
 *           description: Cursor for the next page (null if no more pages)
 *           example: 507f1f77bcf86cd799439010
 *         hasMore:
 *           type: boolean
 *           description: Whether there are more items to fetch
 *           example: true
 *         limit:
 *           type: integer
 *           description: Items per page
 *           example: 20
 */
