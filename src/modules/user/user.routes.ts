import express from "express";
import type { Router, RequestHandler } from "express";
import { getMe, updateProfile } from "./user.controller";
import { singleImageUpload } from "../../utils/multer";
import verifyAuthentication from "../../middleware/authMiddleware";

const router = express.Router() as Router;

// All user routes require authentication
router.use(verifyAuthentication as express.RequestHandler);

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
router.get("/me", getMe as RequestHandler);

/**
 * @swagger
 * /v1/api/user/me:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile (bio, links, profile picture)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 example: Updated bio text
 *               links:
 *                 type: string
 *                 description: JSON string of links object
 *                 example: '{"github":"https://github.com/user","website":"https://mysite.com"}'
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: New profile picture file
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
router.patch("/me", singleImageUpload, updateProfile as RequestHandler);

export default router;
