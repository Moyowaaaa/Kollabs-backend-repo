/**
 * @swagger
 * /v1/api/auth/sign-in:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticate a user with email and password.
 *       On success, an `authToken` httpOnly cookie is set for secure authentication.
 *       The token is NOT returned in the response body for security reasons.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successfully logged in. Auth cookie is set automatically.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: authToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Max-Age=172800
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/sign-out:
 *   post:
 *     summary: User logout
 *     description: |
 *       Log out the current user by clearing the auth cookie.
 *       No request body is required.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out. Auth cookie is cleared.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: authToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 */

/**
 * @swagger
 * /v1/api/auth/sign-up:
 *   post:
 *     summary: User registration
 *     description: Register a new user with profile information, optional profile picture, and optional CV
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *               - roles
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: password123
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
 *                 example: Full-stack developer passionate about building great products
 *               links:
 *                 type: object
 *                 properties:
 *                   github:
 *                     type: string
 *                   behance:
 *                     type: string
 *                   website:
 *                     type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file (JPEG, PNG, GIF, WebP, SVG)
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV/Resume file (PDF, DOC, DOCX) - optional
 *               cvLinkedUrl:
 *                 type: string
 *                 description: External CV link (LinkedIn, portfolio) - alternative to file upload
 *                 example: https://linkedin.com/in/johndoe
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change password for an authenticated user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - comparePassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newpassword123
 *               comparePassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Validation error or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       500:
 *         description: Error sending email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     description: Reset user password using the token from the reset email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Invalid or expired token, or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: User logged in
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/LoginUserData'
 *     LoginUserData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *           example: 507f1f77bcf86cd799439011
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         firstname:
 *           type: string
 *           example: John
 *         lastname:
 *           type: string
 *           example: Doe
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *           example: ["developer", "designer"]
 *         profilePicture:
 *           type: string
 *           description: URL of the user's profile picture
 *           example: https://res.cloudinary.com/example/image/upload/profile.jpg
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's profile is verified
 *           example: true
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email address is verified
 *           example: false
 */

/**
 * @swagger
 * /v1/api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     description: Verify a user's email address using the token from the verification email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token from email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Invalid or expired verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resend the email verification link to a user who hasn't verified yet
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent (if account exists and is not verified)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Email is already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/auth/check-email:
 *   post:
 *     summary: Check email availability
 *     description: Check if an email address is available for registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email is available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Email is already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
