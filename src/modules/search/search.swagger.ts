/**
 * @swagger
 * /v1/api/search:
 *   get:
 *     summary: Global search (projects + people)
 *     description: >
 *       Federated MongoDB `$text` search across projects and user profiles.
 *       Returns empty arrays when `q` is shorter than 2 characters.
 *       Projects exclude `deleted` and `archived`. Users are ranked by text score
 *       (name, roles, bio). Use `authUserId` as `recipientId` when starting a DM.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters for results)
 *         example: design
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 6
 *         description: Max results per type (projects and users)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   example: design
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [draft, pending, ongoing, completed]
 *                       requiredRoles:
 *                         type: array
 *                         items:
 *                           type: string
 *                       author:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       score:
 *                         type: number
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: UserProfile document id
 *                       authUserId:
 *                         type: string
 *                         description: Auth user id (use this for DMs / group members)
 *                       firstname:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                       profilePicture:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           url:
 *                             type: string
 *                           id:
 *                             type: string
 *                       bio:
 *                         type: string
 *                         nullable: true
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
