/**
 * @swagger
 * /v1/api/search:
 *   get:
 *     summary: Global search (projects + people)
 *     description: >
 *       Federated search across projects and user profiles from a single `q`.
 *       It matches names, bios, titles, descriptions, user `roles`, and project
 *       `requiredRoles`. Status phrases in `q` also match projects
 *       (`draft`, `ongoing`, `completed`, `seeking collaborators`, `recruiting`).
 *       Optional `role` / `skill` / `status` query params still AND-filter if sent.
 *       Results require `q` of at least 2 characters or at least one filter.
 *       Projects exclude `deleted` and `archived` unless a pipeline status is
 *       requested. Use `authUserId` as `recipientId` when starting a DM.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Name, role, skill, keyword, or status phrase (minimum 2 characters). Optional when filters are set.
 *         example: design
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter people by `roles` and projects by `requiredRoles`
 *         example: UI/UX Designer
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Extra tag filter on the same role arrays (AND with `role` if both are set)
 *         example: Writer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, seeking_collaborators, ongoing, completed]
 *         description: Filter projects by pipeline status
 *         example: ongoing
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
 *                 filters:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       nullable: true
 *                     skill:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       nullable: true
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
 *                         enum: [draft, seeking_collaborators, ongoing, completed]
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
