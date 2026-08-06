/**
 * @swagger
 * /v1/api/notifications/test-notification:
 *   post:
 *     summary: Create a test notification
 *     description: Creates a test notification for the authenticated user. Intended for development/manual testing.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Test notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test notification created successfully
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create test notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Returns a paginated list of the authenticated user's notifications (excluding soft-deleted). Actor is populated with profile info when available.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
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
 *         description: Number of notifications per page
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationWithActor'
 *                 unreadNotificationCount:
 *                   type: integer
 *                   example: 3
 *                   description: Total unread notifications for the user
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalNotifications:
 *                       type: integer
 *                       example: 42
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 * /v1/api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: Returns the number of unread notifications for the authenticated user. Used for the bell badge.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadNotificationCount:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 * /v1/api/notifications/{notificationId}:
 *   get:
 *     summary: Get a single notification
 *     description: Returns a single notification belonging to the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification found
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
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
 *     summary: Mark a notification as read
 *     description: Marks a single notification as read for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
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
 *     summary: Soft-delete a notification
 *     description: Soft-deletes a notification (sets deletedAt and purgeAt +90 days). Soft-deleted notifications are hidden from list/unread queries.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
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
 *     NotificationMeta:
 *       type: object
 *       properties:
 *         projectId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         collabRequestId:
 *           type: string
 *           example: 507f1f77bcf86cd799439013
 *     NotificationActorProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstname:
 *           type: string
 *           example: Andrea
 *         lastname:
 *           type: string
 *           example: Smith
 *         profilePicture:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             id:
 *               type: string
 *     NotificationActor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *           example: andrea@example.com
 *         userProfile:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             firstname:
 *               type: string
 *               example: Andrea
 *             lastname:
 *               type: string
 *               example: Smith
 *             profilePicture:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 id:
 *                   type: string
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         recipientId:
 *           type: string
 *           description: User ID of the notification recipient
 *           example: 507f1f77bcf86cd799439014
 *         actorId:
 *           type: string
 *           description: User ID who triggered the notification
 *           example: 507f1f77bcf86cd799439015
 *         type:
 *           type: string
 *           enum:
 *             - test
 *             - project_created
 *             - project_updated
 *             - project_deleted
 *             - project_archived
 *             - project_unarchived
 *             - project_completed
 *             - project_uncompleted
 *             - collab_request_received
 *             - collab_request_accepted
 *             - collab_request_rejected
 *         title:
 *           type: string
 *           example: New request
 *         body:
 *           type: string
 *           example: Andrea Smith is requesting to join your project: Kollabs MVP
 *         isRead:
 *           type: boolean
 *           example: false
 *         meta:
 *           type: object
 *           properties:
 *             projectId:
 *               type: string
 *             collabRequestId:
 *               type: string
 *         readAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *         purgeAt:
 *           type: string
 *           format: date-time
 *           description: Scheduled hard-delete time after soft delete (+90 days)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     NotificationWithActor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         recipientId:
 *           type: string
 *           example: 507f1f77bcf86cd799439014
 *         actorId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             email:
 *               type: string
 *               example: andrea@example.com
 *             userProfile:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 firstname:
 *                   type: string
 *                   example: Andrea
 *                 lastname:
 *                   type: string
 *                   example: Smith
 *                 profilePicture:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     id:
 *                       type: string
 *         type:
 *           type: string
 *           enum:
 *             - test
 *             - project_created
 *             - project_updated
 *             - project_deleted
 *             - project_archived
 *             - project_unarchived
 *             - project_completed
 *             - project_uncompleted
 *             - collab_request_received
 *             - collab_request_accepted
 *             - collab_request_rejected
 *         title:
 *           type: string
 *           example: New request
 *         body:
 *           type: string
 *           example: Andrea Smith is requesting to join your project: Kollabs MVP
 *         isRead:
 *           type: boolean
 *           example: false
 *         meta:
 *           type: object
 *           properties:
 *             projectId:
 *               type: string
 *             collabRequestId:
 *               type: string
 *         readAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *         purgeAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
