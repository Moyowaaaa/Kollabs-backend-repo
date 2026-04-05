# Kollabs Backend — Comprehensive Documentation

> **Last Updated:** April 2026
> **Version:** 1.0.0
> **Repository:** `Kollabs-backend-repo`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Directory Structure](#3-architecture--directory-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Design](#5-database-design)
6. [Authentication System](#6-authentication-system)
7. [API Reference](#7-api-reference)
8. [Modules Deep Dive](#8-modules-deep-dive)
9. [Middleware](#9-middleware)
10. [Utilities & Services](#10-utilities--services)
11. [Caching Strategy](#11-caching-strategy)
12. [Email System](#12-email-system)
13. [File Upload System](#13-file-upload-system)
14. [Error Handling](#14-error-handling)
15. [Logging](#15-logging)
16. [Coding Conventions](#16-coding-conventions)
17. [Deployment](#17-deployment)
18. [Known Gaps & Future Work](#18-known-gaps--future-work)

---

## 1. Project Overview

**Kollabs** (also referred to as **Koneticus**) is a collaborative platform for creative professionals. It allows users to:

- Post project ideas and seek collaborators
- Search for projects by skill/role requirements
- Send and manage collaboration requests
- Build professional profiles with portfolio links and CVs
- Browse a curated feed of projects (chronological and trending)

The backend is a **RESTful API** that powers the Kollabs frontend (a Next.js application). It handles all business logic, data persistence, authentication, file management, email delivery, and caching.

### Core Domain Concepts

| Concept                    | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| **User (Auth)**            | Authentication record — email, hashed password, JWT tokens                  |
| **UserProfile**            | Extended profile — name, roles, bio, links, CV, profile picture             |
| **Project**                | An idea/project posted by a user seeking collaborators                      |
| **Collaboration Request**  | A proposal from one user to join another user's project                     |
| **Feed**                   | A paginated, cached view of all public projects                             |
| **Waitlist**               | Pre-launch email collection for early access                                |

---

## 2. Technology Stack

| Layer              | Technology                  | Version   | Purpose                                    |
|--------------------|-----------------------------|-----------|--------------------------------------------|
| **Runtime**        | Node.js                     | —         | JavaScript runtime                         |
| **Language**       | TypeScript                  | ^5.9.2    | Type-safe development                      |
| **Framework**      | Express.js                  | ^5.1.0    | HTTP server and routing                    |
| **Database**       | MongoDB                     | —         | Document database (via Mongoose ^8.17.1)   |
| **Caching**        | Redis                       | —         | Feed caching (via IoRedis ^5.9.2)          |
| **Auth**           | JWT (jsonwebtoken ^9.0.2)   | —         | Token-based authentication                 |
| **Password Hash**  | bcryptjs ^3.0.2             | —         | Password hashing (10 salt rounds)          |
| **File Storage**   | Cloudinary ^2.8.0           | —         | Image and document cloud storage           |
| **File Parsing**   | Multer ^2.0.2               | —         | Multipart form-data parsing                |
| **Email**          | Resend ^6.6.0               | —         | Transactional email delivery               |
| **Templates**      | EJS ^3.1.10                 | —         | HTML email templates                       |
| **Validation**     | Validator.js ^13.15.15      | —         | Email and input validation                 |
| **Logging**        | Winston ^3.18.3             | —         | Application logging (file + console)       |
| **HTTP Logging**   | Morgan ^1.10.1              | —         | HTTP request logging                       |
| **Rate Limiting**  | express-rate-limit ^8.2.1   | —         | Brute force and spam protection            |
| **API Docs**       | Swagger (swagger-jsdoc)     | ^6.2.8    | OpenAPI 3.0 documentation                  |
| **Dev Tooling**    | Nodemon, ESLint, Husky      | —         | Hot-reload, linting, git hooks             |

---

## 3. Architecture & Directory Structure

The backend follows a **modular architecture** where each domain entity is self-contained inside `src/modules/`. Each module includes its own model, interface, controller, routes, and Swagger documentation.

```
Kollabs-backend-repo/
├── .env                        # Environment variables (gitignored)
├── .eslintrc.json              # ESLint configuration
├── .husky/                     # Git hooks (pre-commit linting)
├── nodemon.json                # Nodemon config for dev hot-reload
├── package.json                # Dependencies and scripts
├── render.yaml                 # Render.com deployment config
├── tsconfig.json               # TypeScript compiler configuration
├── templates/                  # EJS email templates
│   ├── waitlist-confirmation.ejs
│   ├── password-reset.ejs
│   └── verification.ejs
├── logs/                       # Application log files
└── src/
    ├── server.ts               # ★ Application entry point
    ├── db/
    │   └── db.ts               # MongoDB connection handler
    ├── interfaces/
    │   └── error.interface.ts  # Global error interface
    ├── lib/
    │   ├── log/
    │   │   ├── morgan.log.ts   # HTTP request logger setup
    │   │   └── winston.log.ts  # Application logger setup
    │   └── redis.ts            # Redis client (lazy init, graceful fallback)
    ├── middleware/
    │   ├── authMiddleware.ts   # JWT verification middleware
    │   ├── ErrorLogger.ts      # Global error handler
    │   └── rateLimiter.ts      # Rate limiting configs
    ├── models/
    │   └── error.model.ts      # (Empty — error model placeholder)
    ├── modules/
    │   ├── auth/               # Authentication module
    │   ├── user/               # User profile module
    │   ├── projects/           # Projects module
    │   ├── collaboration-requests/  # Collaboration requests module
    │   ├── feed/               # Feed module (cached)
    │   └── waitlist/           # Waitlist module
    └── utils/
        ├── cache.service.ts    # Redis cache abstraction layer
        ├── cloudinary.ts       # Cloudinary upload/delete helpers
        ├── createAuthToken.ts  # JWT token generator
        ├── email.service.ts    # Resend email service
        ├── multer.ts           # File upload middleware configs
        └── swagger.ts          # Swagger/OpenAPI configuration
```

### Module Structure Convention

Every module follows this pattern:

```
modules/<module-name>/
├── index.ts                    # Re-exports routes for clean imports
├── <module>.interface.ts       # TypeScript interfaces
├── <module>.model.ts           # Mongoose schema and model
├── <module>.controller.ts      # Request handlers (business logic)
├── <module>.routes.ts          # Express router definitions
└── <module>.swagger.ts         # Swagger JSDoc annotations
```

---

## 4. Environment Configuration

The backend expects the following environment variables (in `.env`):

| Variable                 | Required | Description                                        |
|--------------------------|----------|----------------------------------------------------|
| `PORT`                   | No       | Server port (default: `8081`)                      |
| `NODE_ENV`               | No       | `development` or `production`                      |
| `MONGO_URI`              | Yes      | MongoDB connection string (development)            |
| `MONGO_URI_PROD`         | Yes      | MongoDB connection string (production)             |
| `SECRET`                 | Yes      | JWT signing secret                                 |
| `CLOUDINARY_CLOUD_NAME`  | Yes      | Cloudinary cloud name                              |
| `CLOUDINARY_API_KEY`     | Yes      | Cloudinary API key                                 |
| `CLOUDINARY_API_SECRET`  | Yes      | Cloudinary API secret                              |
| `RESEND_API_KEY`         | Yes      | Resend email API key                               |
| `EMAIL_FROM`             | No       | Sender email (default: `onboarding@resend.dev`)    |
| `FRONTEND_URL`           | No       | Frontend URL for email links (default: `http://localhost:3000`) |
| `REDIS_URL`              | No       | Redis connection URL (default: `redis://localhost:6379`) |

### Database Selection Logic

```typescript
// src/db/db.ts
const Db = process.env.NODE_ENV === "development"
  ? process.env.MONGO_URI
  : process.env.MONGO_URI_PROD;
```

---

## 5. Database Design

### Collections & Relationships

```
┌─────────────┐       1:1        ┌───────────────┐
│    User      │─────────────────▶│  UserProfile   │
│  (Auth)      │                  │               │
│ _id          │◀─────────────────│ authUser (ref) │
│ email        │                  │ firstname     │
│ password     │                  │ lastname      │
│ userProfile  │                  │ roles[]       │
│ isEmailVerified│                │ bio           │
│ resetToken   │                  │ profilePicture│
│ verifyToken  │                  │ links{}       │
└──────┬───────┘                  │ cv{}          │
       │                          │ isVerified    │
       │ 1:N (author)             └───────────────┘
       ▼
┌──────────────┐      1:N       ┌─────────────────────┐
│   Projects   │────────────────▶│CollaborationRequest │
│ _id          │                │ projectId (ref)      │
│ title        │                │ requesterId (ref)    │
│ description  │                │ proposal             │
│ author (ref) │                │ media[]              │
│ collaborators│                │ status               │
│ media[]      │                │ (pending/accepted/   │
│ status       │                │  rejected)           │
│ teamSize     │                └─────────────────────┘
│ requiredRoles│
│ conversationId│
└──────────────┘

┌──────────────┐
│   Waitlist   │
│ email        │
└──────────────┘
```

### Schema Details

#### User (Auth) — `users` collection
```typescript
{
  email: string           // unique, required
  password: string        // bcrypt hashed, required
  userProfile: ObjectId   // ref → UserProfile
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  isEmailVerified: boolean  // default: false
}
```

**Static Methods:**
- `signUpUser(email, password)` — validates, checks uniqueness, hashes, creates
- `loginUser(email, password)` — validates, compares password
- `changePassword(email, newPassword, currentPassword)` — verifies current, prevents reuse

#### UserProfile — `userprofiles` collection
```typescript
{
  authUser: ObjectId        // ref → User, unique, required
  firstname: string         // required
  lastname: string          // required
  roles: string[]           // required (e.g., ["UI/UX Designer", "Frontend"])
  profilePicture?: {
    url: string             // Cloudinary URL
    id: string              // Cloudinary public ID
  }
  bio?: string              // max 150 characters
  links?: {
    github?: string
    behance?: string
    website?: string
    linkedin?: string
  }
  cv?: {
    fileUrl?: string        // Cloudinary URL (uploaded file)
    fileId?: string         // Cloudinary public ID
    linkedUrl?: string      // External link (LinkedIn, portfolio)
    fileName?: string       // Original filename
  }
  isVerified: boolean       // default: false
  createdAt: Date           // auto (timestamps: true)
  updatedAt: Date           // auto
}
```

#### Projects — `projects` collection
```typescript
{
  title: string             // required
  description: string       // required
  author: ObjectId          // ref → User, required
  collaborators: ObjectId[] // ref → User, default: []
  media: [{                 // Cloudinary images
    url: string
    id: string
  }]
  status: enum              // "draft" | "pending" | "ongoing" | "completed" | "deleted" | "archived"
  teamSize: number          // default: 1
  conversationId?: string   // placeholder for future messaging
  requiredRoles: string[]   // skills/roles needed
  createdAt: Date           // auto
  updatedAt: Date           // auto
}
```

**Indexes:**
- Text index on `{ title, description, requiredRoles }` with weights `{ title: 10, description: 5, requiredRoles: 8 }`

#### CollaborationRequest — `collaborationrequests` collection
```typescript
{
  projectId: string         // ref → Projects, required
  requesterId: string       // ref → User, required
  proposal: string          // required — why they want to join
  media: [{                 // optional supporting files
    url: string
    id: string
  }]
  status: enum              // "pending" | "accepted" | "rejected"
  createdAt: Date           // auto
  updatedAt: Date           // auto
}
```

**Indexes:**
- Compound unique index on `{ projectId, requesterId }` — prevents duplicate requests

---

## 6. Authentication System

### Flow Overview

```
                   ┌─────────────┐
                   │  Sign Up    │
                   │ (POST)      │
                   └──────┬──────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Create auth user   │
              │ 2. Hash password      │
              │ 3. Generate verify    │
              │    token (24hr)       │
              │ 4. Create profile     │
              │ 5. Upload files       │
              │ 6. Send verify email  │
              │ 7. MongoDB transaction│
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Verify Email         │
              │  GET /verify/:token   │
              │  Sets isEmailVerified │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Login                │
              │  POST /sign-in        │
              │  Returns httpOnly     │
              │  cookie + JWT + user  │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Authenticated        │
              │  All requests use     │
              │  httpOnly cookie OR   │
              │  Bearer token header  │
              └───────────────────────┘
```

### Token Strategy

- **JWT Signing:** `jsonwebtoken.sign({ _id }, SECRET, { expiresIn: "2d" })`
- **Token Delivery:** httpOnly cookie (`authToken`, 2-day expiry, `sameSite: lax`)
- **Token also returned** in login response body (for non-browser clients)
- **Verification:** Middleware checks cookie first, then `Authorization: Bearer <token>` header

### Password Security

- **Hashing:** bcryptjs with 10 salt rounds
- **Reset Flow:** Crypto token → SHA-256 hash stored in DB → 1hr expiry
- **Change Password:** Requires current password verification, prevents reuse

---

## 7. API Reference

**Base URL:** `http://localhost:4000/v1/api`
**Production:** `https://kollabs-backend-repo.onrender.com/v1/api`
**Swagger Docs:** `http://localhost:4000/api-docs`

### Authentication Routes — `/v1/api/auth`

All auth routes are **rate limited** (120 requests / 15 min per IP).

| Method | Endpoint                       | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| POST   | `/auth/sign-up`                | No   | Register with profile + files        |
| POST   | `/auth/sign-in`                | No   | Login (returns cookie + token)       |
| POST   | `/auth/sign-out`               | No   | Logout (clears cookie)               |
| POST   | `/auth/check-email`            | No   | Check email availability             |
| POST   | `/auth/change-password`        | No   | Change password (needs current pw)   |
| POST   | `/auth/forgot-password`        | No   | Request password reset email         |
| POST   | `/auth/reset-password/:token`  | No   | Reset password with token            |
| GET    | `/auth/verify-email/:token`    | No   | Verify email address                 |
| POST   | `/auth/resend-verification`    | No   | Resend verification email            |

### User Routes — `/v1/api/user`

All user routes require authentication.

| Method | Endpoint      | Auth | Description                          |
|--------|---------------|------|--------------------------------------|
| GET    | `/user/me`    | Yes  | Get current user + populated profile |
| PATCH  | `/user/me`    | Yes  | Update profile (with file uploads)   |
| GET    | `/user/:id`   | Yes  | Get user by ID                       |

### Project Routes — `/v1/api/projects`

All project routes require authentication.

| Method | Endpoint                         | Auth | Description                          |
|--------|----------------------------------|------|--------------------------------------|
| POST   | `/projects`                      | Yes  | Create project (with media)          |
| GET    | `/projects`                      | Yes  | Get current user's projects          |
| GET    | `/projects/search`               | Yes  | Search projects (text + filters)     |
| GET    | `/projects/project-feed`         | Yes  | Get all projects (paginated)         |
| GET    | `/projects/:projectId`           | Yes  | Get single project                   |
| PUT    | `/projects/:projectId`           | Yes  | Full update (owner only)             |
| PATCH  | `/projects/:projectId`           | Yes  | Partial update (owner only)          |
| PATCH  | `/projects/:projectId/status`    | Yes  | Update status (owner only)           |
| PATCH  | `/projects/:projectId/archive`   | Yes  | Archive project (owner only)         |
| DELETE | `/projects/:projectId`           | Yes  | Soft delete (owner only)             |

### Collaboration Request Routes — `/v1/api/collaboration-requests`

All routes require authentication.

| Method | Endpoint                                         | Auth | Description                          |
|--------|--------------------------------------------------|------|--------------------------------------|
| POST   | `/collaboration-requests/projects/:projectId/requests` | Yes  | Submit collaboration request         |
| GET    | `/collaboration-requests/projects/:projectId/requests` | Yes  | Get requests for project (owner)     |
| GET    | `/collaboration-requests/my-requests`            | Yes  | Get user's sent requests             |
| PATCH  | `/collaboration-requests/:requestId/accept`      | Yes  | Accept request (project owner)       |
| PATCH  | `/collaboration-requests/:requestId/reject`      | Yes  | Reject request (project owner)       |

### Feed Routes — `/v1/api/feed`

All routes require authentication. Responses are **cached in Redis**.

| Method | Endpoint          | Auth | Description                                    |
|--------|-------------------|------|------------------------------------------------|
| GET    | `/feed`           | Yes  | Main feed (cursor pagination, 5min cache)      |
| GET    | `/feed/trending`  | Yes  | Trending by collaboration activity (3min cache)|

**Feed Query Params:**
- `cursor` — ID of last item for pagination
- `limit` — Items per page (default: 20, max: 50)

### Waitlist Routes — `/v1/api`

| Method | Endpoint          | Auth | Description                          |
|--------|-------------------|------|--------------------------------------|
| POST   | `/waitlist`       | No   | Register for waitlist (rate limited) |
| GET    | `/waitlist`       | Yes  | Get all waitlisters                  |
| DELETE | `/waitlist/:id`   | Yes  | Remove from waitlist                 |

---

## 8. Modules Deep Dive

### 8.1 Auth Module

**Files:** `src/modules/auth/`

**Sign-Up Flow (POST `/auth/sign-up`):**
1. Accepts `multipart/form-data` (fields: `image`, `cv`)
2. Parses roles (JSON string or array) and links (JSON string or object)
3. Creates auth user via `userAuthModel.signUpUser()` (validates + hashes)
4. Generates email verification token (crypto, SHA-256 hashed, 24hr expiry)
5. Uploads profile picture to Cloudinary (`user_profiles` folder)
6. Uploads CV to Cloudinary (`user_cvs` folder) or stores external link
7. Creates UserProfile linked to auth user
8. Entire operation wrapped in **MongoDB transaction** for atomicity
9. Sends verification email via Resend (non-blocking — signup succeeds even if email fails)

**Login (POST `/auth/sign-in`):**
1. Validates credentials via `userAuthModel.loginUser()`
2. Populates user profile
3. Creates JWT token (2-day expiry)
4. Sets `authToken` httpOnly cookie
5. Returns user data + token in response

### 8.2 Projects Module

**Files:** `src/modules/projects/`

**Key Behaviors:**
- **Soft Delete:** `deleteProject` sets status to `"deleted"` (not hard delete)
- **Archive:** Separate archive status, recoverable
- **Status Lifecycle:** `draft` → `pending` → `ongoing` → `completed`
- **Media:** Up to 10 images per project, uploaded to Cloudinary (`projects_media`)
- **Search:** Full-text search using MongoDB text indexes on title, description, requiredRoles
- **Cache Invalidation:** Every create/update/delete calls `invalidateFeedCache()` to bust Redis cache
- **Authorization:** Only the project author can modify/delete their own projects

### 8.3 Collaboration Requests Module

**Files:** `src/modules/collaboration-requests/`

**Key Behaviors:**
- Can only request collaboration on **ongoing** projects
- **Cannot** request to join your own project
- **Cannot** request if already a collaborator
- **Duplicate prevention:** Compound unique index on `{ projectId, requesterId }`
- **Team size enforcement:** Checks `teamSize - 1` (minus author) against current collaborator count
- **Accepting:** Adds requester to project's `collaborators` array via `$addToSet`
- **Media attachments:** Optional portfolio/work samples with request

### 8.4 Feed Module

**Files:** `src/modules/feed/`

**Chronological Feed (GET `/feed`):**
- Cursor-based pagination for infinite scroll
- Queries `limit + 1` items to detect "has more"
- Fully populated author and collaborator profiles
- Cached in Redis (5-minute TTL)

**Trending Feed (GET `/feed/trending`):**
- MongoDB aggregation pipeline:
  1. Lookup collaboration requests for each project
  2. Count accepted requests and total requests
  3. Sort by: collaborator count → accepted requests → total interest → recency
- Populated after aggregation
- Cached (3-minute TTL)

### 8.5 User Module

**Files:** `src/modules/user/`

**Profile Update (PATCH `/user/me`):**
- Partial update — only provided fields are changed
- If new profile picture uploaded: deletes old one from Cloudinary first
- If new CV uploaded: deletes old one from Cloudinary first
- Supports switching between uploaded CV and linked CV

### 8.6 Waitlist Module

**Files:** `src/modules/waitlist/`

- Public registration endpoint with strict rate limiting (3/hour)
- Sends confirmation email via Resend with branded EJS template
- Admin endpoints to view and manage waitlist entries

---

## 9. Middleware

### 9.1 Authentication Middleware (`authMiddleware.ts`)

```typescript
// Token resolution priority:
// 1. httpOnly cookie (req.cookies.authToken) — browser clients
// 2. Authorization: Bearer <token> header — API/mobile clients
```

- Verifies JWT with `process.env.SECRET`
- Looks up user in database to confirm existence
- Attaches `req.user` with `{ _id }` for downstream controllers
- Returns 401 if token missing, invalid, or user not found

### 9.2 Error Logger (`ErrorLogger.ts`)

Global error handler that catches errors passed via `next(error)`:
- Checks `res.headersSent` to prevent double-response
- Returns `{ message }` with appropriate status code
- Defaults to 500 if no status set

### 9.3 Rate Limiters (`rateLimiter.ts`)

| Limiter          | Window     | Max Requests | Applied To           |
|------------------|------------|-------------|----------------------|
| `generalLimiter` | 15 minutes | 100         | General API routes   |
| `authLimiter`    | 15 minutes | 120         | All auth routes      |
| `waitlistLimiter`| 1 hour     | 3           | Waitlist registration|

---

## 10. Utilities & Services

### 10.1 Cloudinary (`cloudinary.ts`)

- **`uploadSingleToCloudinary(file, folder)`** — Streams multer buffer to Cloudinary
- **`uploadMultipleToCloudinary(files, folder)`** — Parallel upload of multiple files
- **`deleteSingleFromCloudinary(publicId)`** — Removes single asset
- **`deleteMultipleFromCloudinary(publicIds)`** — Batch removal

Cloudinary folders used:
- `user_profiles` — Profile pictures
- `user_cvs` — CV documents
- `projects_media` — Project images
- `collaboration_requests` — Request attachments

### 10.2 JWT Token Creator (`createAuthToken.ts`)

```typescript
jwt.sign({ _id }, SECRET, { expiresIn: "2d" });
```

- Payload: user's MongoDB `_id` only
- Expiry: 2 days
- Throws if `SECRET` env var is missing

### 10.3 Swagger (`swagger.ts`)

- OpenAPI 3.0 specification
- Auto-discovers annotations from `src/modules/**/*.swagger.ts`
- Defines reusable schemas: `Error`, `SuccessMessage`, `AuthResponse`, `UserLinks`
- Security schemes: `bearerAuth` (JWT header) and `cookieAuth` (httpOnly cookie)
- Served at `/api-docs`

---

## 11. Caching Strategy

### Redis Client (`lib/redis.ts`)

- **Lazy initialization** — connects only when first cache operation is attempted
- **Graceful degradation** — if Redis is unavailable, all cache operations return `null` silently
- **Connection management:** Prevents multiple simultaneous connection attempts
- **Retry strategy:** 3 attempts with exponential backoff, then permanent skip
- **TLS support:** Auto-detects Upstash URLs and enables TLS
- **Reconnection:** Only reconnects on `READONLY` or `ECONNRESET` errors

### Cache Service (`utils/cache.service.ts`)

| Method              | Description                                    |
|---------------------|------------------------------------------------|
| `get<T>(key)`       | Get cached value, returns `null` on miss       |
| `set(key, data, ttl)` | Set value with TTL (default: 300s)          |
| `delete(key)`       | Remove specific key                            |
| `invalidatePattern(pattern)` | Delete all keys matching glob pattern |

### Cache Keys

| Pattern                      | TTL    | Invalidated On                |
|------------------------------|--------|-------------------------------|
| `feed:{cursor}:{limit}`     | 5 min  | Project create/update/delete  |
| `feed:trending:{limit}`     | 3 min  | Project create/update/delete  |

---

## 12. Email System

### Provider: Resend

Previously used Nodemailer with Zoho SMTP (code still present, commented out). Switched to **Resend** for reliability.

### Email Templates (`templates/`)

| Template                      | Trigger                     | Data Variables          |
|-------------------------------|-----------------------------|-------------------------|
| `waitlist-confirmation.ejs`   | Waitlist registration       | `{ email }`             |
| `password-reset.ejs`          | Forgot password request     | `{ resetUrl }`          |
| `verification.ejs`            | New user signup             | `{ email, verificationUrl }` |

### Email Functions (`utils/email.service.ts`)

- `sendWaitlistConfirmation(email)` — Branded welcome email
- `sendPasswordResetEmail(email, resetUrl)` — Reset link (1hr expiry)
- `sendVerificationEmail(email, verificationUrl)` — Verify link (24hr expiry)

---

## 13. File Upload System

### Multer Configuration (`utils/multer.ts`)

All uploads use **memory storage** (buffer in RAM, then streamed to Cloudinary).

| Export                   | Field(s)            | Max Files | Max Size | Allowed Types                    |
|--------------------------|---------------------|-----------|----------|----------------------------------|
| `singleImageUpload`     | `image`             | 1         | 5MB      | JPEG, PNG, GIF, WebP, SVG       |
| `multipleImageUpload`   | `images`            | 10        | 5MB      | JPEG, PNG, GIF, WebP, SVG       |
| `projectMediaUpload`    | `media`             | 10        | 5MB      | JPEG, PNG, GIF, WebP, SVG       |
| `singleCvUpload`        | `cv`                | 1         | 10MB     | PDF, DOC, DOCX                  |
| `imageAndCvUpload`      | `image` + `cv`      | 1 + 1     | 10MB     | Images + Documents               |

### Upload Flow

```
Client → multipart/form-data → Multer (memory) → Controller → Cloudinary → URL stored in MongoDB
```

---

## 14. Error Handling

### Pattern

All controllers follow this error handling pattern:

```typescript
try {
  // Business logic
} catch (err) {
  const error = err as IError;
  error.status = 500;
  error.message = "Descriptive error message";
  return next(error); // Passed to ErrorLogger middleware
}
```

### Error Interface

```typescript
interface IError {
  status?: number;
  message: string;
}
```

### HTTP Status Codes Used

| Code | Usage                                                |
|------|------------------------------------------------------|
| 200  | Successful read/update operations                    |
| 201  | Successful resource creation                         |
| 400  | Validation errors, duplicate resources, invalid input|
| 401  | Missing/invalid authentication                       |
| 403  | Forbidden (e.g., non-owner trying to modify project) |
| 404  | Resource not found                                   |
| 500  | Internal server errors                               |

---

## 15. Logging

### Winston (`lib/log/winston.log.ts`)

Application-level logging:
- Console output with colors
- File output to `logs/` directory
- Log levels: error, warn, info, debug

### Morgan (`lib/log/morgan.log.ts`)

HTTP request logging:
- Logs method, URL, status, response time
- Piped through Winston for consistent format

---

## 16. Coding Conventions

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- Target: `ES2020`
- Module: `CommonJS`
- All types defined via explicit interfaces (not `any`)
- ESLint rule `@typescript-eslint/no-explicit-any: error` available via `npm run check:any`

### File Naming

- `kebab-case` for module folders: `collaboration-requests/`
- `camelCase` for file names: `auth.controller.ts`
- Each file serves a single responsibility

### Import Organization

```typescript
// 1. External packages
import express from "express";
// 2. Internal modules
import { IError } from "../../interfaces/error.interface";
// 3. Sibling imports
import { AuthenticatedRequest } from "../auth/auth.interface";
```

### Route Conventions

- All routes versioned under `/v1/api/`
- RESTful naming: nouns for resources, HTTP verbs for actions
- Route-level authentication via `router.use(verifyAuthentication)`
- Specific middleware per route (e.g., `projectMediaUpload`)

### Response Format

```typescript
// Success
{ message: "...", data: { ... } }
{ message: "...", project: { ... } }
{ projects: [...], pagination: { ... } }

// Error
{ error: "Error message" }
{ message: "Error message" }
```

### Git Workflow

- Husky pre-commit hooks for linting
- Feature branches → `dev` branch via PRs
- ESLint enforced with `--max-warnings=0`

---

## 17. Deployment

### Render.com

Configured via `render.yaml`:

```yaml
services:
  - type: web
    name: kollabs-backend
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

**Production URL:** `https://kollabs-backend-repo.onrender.com/`

### Build Process

```bash
npm run build    # Compiles TypeScript → dist/
npm start        # Runs node dist/server.js
```

### CORS Configuration

Allowed origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://www.koneticus.com/`
- `https://www.koneticus.com`

---

## 18. Known Gaps & Future Work

### Missing Backend Features

| Feature                  | Status      | Notes                                          |
|--------------------------|-------------|-------------------------------------------------|
| **Messaging/Chat**       | Not started | `conversationId` field exists on Projects but no message model/routes |
| **Notifications**        | Not started | No notification system for requests, messages, updates |
| **User Search/Discovery**| Not started | No endpoint to browse/search users by role or skill |
| **Social Graph**         | Not started | No follow/connect system between users          |
| **Project Bookmarks**    | Not started | No save/bookmark functionality                   |
| **Analytics/Metrics**    | Not started | No view counts, engagement tracking              |
| **Admin/Moderation**     | Not started | No content moderation or admin panel             |
| **Testing**              | Not started | `"test": "echo \"No tests yet\" && exit 0"`     |
| **CI/CD**                | Not started | README mentions GitHub Actions but none configured |

### Known Issues

- `getUser` controller uses `req.user._id` instead of `req.params.id` — always returns the authenticated user
- `collaboration-requests.controller.ts` uses manual `authorization` header parsing instead of auth middleware (inconsistent with projects module)
- `bcrpyt` (typo) package in dependencies alongside `bcrypt` and `bcryptjs` — only `bcryptjs` is actually used
- Auth rate limiter set to 120 (was 12, likely relaxed for development)
- `error.model.ts` is empty
