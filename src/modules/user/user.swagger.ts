/**
 * @swagger
 * /v1/api/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile retrieved
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userProfile:
 *                       type: object
 *                       properties:
 *                         firstname:
 *                           type: string
 *                         lastname:
 *                           type: string
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                         bio:
 *                           type: string
 *                         profilePicture:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             id:
 *                               type: string
 *                         cv:
 *                           type: object
 *                           properties:
 *                             fileUrl:
 *                               type: string
 *                               description: Cloudinary URL for uploaded CV
 *                             fileId:
 *                               type: string
 *                               description: Cloudinary public ID
 *                             linkedUrl:
 *                               type: string
 *                               description: External CV link
 *                             fileName:
 *                               type: string
 *                               description: Original filename
 *                         links:
 *                           $ref: '#/components/schemas/UserLinks'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/user/me:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile (bio, links, profile picture, CV)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["developer", "designer"]
 *               bio:
 *                 type: string
 *                 example: Updated bio text
 *               links:
 *                 type: string
 *                 description: JSON string of links object
 *                 example: '{"github":"https://github.com/user","website":"https://mysite.com"}'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New profile picture file (JPEG, PNG, GIF, WebP, SVG)
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV/Resume file (PDF, DOC, DOCX)
 *               cvLinkedUrl:
 *                 type: string
 *                 description: External CV link (set empty string to clear CV)
 *                 example: https://linkedin.com/in/johndoe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 profile:
 *                   type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *           example: 507f1f77bcf86cd799439011
 *         email:
 *           type: string
 *           description: User email
 *           example: user@example.com
 *         userProfile:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: John Doe
 *             firstname:
 *               type: string
 *               example: John
 *             lastname:
 *               type: string
 *               example: Doe
 *             roles:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["developer", "designer"]
 *             bio:
 *               type: string
 *               example: Full-stack developer passionate about building great products
 *             profilePicture:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://res.cloudinary.com/example/image/upload/profile.jpg
 *                 id:
 *                   type: string
 *                   example: profile_images/abc123
 *             cv:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 *                   description: Cloudinary URL for uploaded CV
 *                 fileId:
 *                   type: string
 *                   description: Cloudinary public ID
 *                 linkedUrl:
 *                   type: string
 *                   description: External CV link
 *                 fileName:
 *                   type: string
 *                   description: Original filename
 *             links:
 *               $ref: '#/components/schemas/UserLinks'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
