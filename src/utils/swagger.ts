import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Koneticus API",
      version: "1.0.0",
      description:
        "API documentation for koneticus - A collaborative platform for creators",
      contact: {
        name: "koneticus Team",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://kollabs-backend-repo.onrender.com/",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your JWT token (for non-browser clients like mobile apps)",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "authToken",
          description:
            "HttpOnly cookie set automatically on login (for browser clients)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        SuccessMessage: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
        AuthResponse: {
          type: "object",
          description:
            "Legacy auth response (deprecated - use LoginResponse for sign-in)",
          properties: {
            message: {
              type: "string",
              description: "Response message",
            },
            token: {
              type: "string",
              description:
                "JWT authentication token (only for sign-up, sign-in uses cookies)",
            },
          },
        },
        UserLinks: {
          type: "object",
          properties: {
            github: { type: "string" },
            behance: { type: "string" },
            website: { type: "string" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            recipientId: {
              type: "string",
              description: "User ID of the notification recipient",
            },
            actorId: {
              type: "string",
              description: "User ID who triggered the notification",
            },
            type: {
              type: "string",
              enum: [
                "test",
                "project_created",
                "project_updated",
                "project_deleted",
                "project_archived",
                "project_unarchived",
                "project_completed",
                "project_uncompleted",
                "collab_request_received",
                "collab_request_accepted",
                "collab_request_rejected",
              ],
            },
            title: { type: "string", example: "New request" },
            body: {
              type: "string",
              example:
                "Andrea Smith is requesting to join your project: Kollabs MVP",
            },
            isRead: { type: "boolean", example: false },
            meta: {
              type: "object",
              properties: {
                projectId: { type: "string" },
                collabRequestId: { type: "string" },
              },
            },
            readAt: { type: "string", format: "date-time", nullable: true },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            purgeAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        NotificationWithActor: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            recipientId: { type: "string" },
            actorId: {
              type: "object",
              properties: {
                _id: { type: "string" },
                email: { type: "string", example: "andrea@example.com" },
                userProfile: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    firstname: { type: "string", example: "Andrea" },
                    lastname: { type: "string", example: "Smith" },
                    profilePicture: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        id: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            type: {
              type: "string",
              enum: [
                "test",
                "project_created",
                "project_updated",
                "project_deleted",
                "project_archived",
                "project_unarchived",
                "project_completed",
                "project_uncompleted",
                "collab_request_received",
                "collab_request_accepted",
                "collab_request_rejected",
              ],
            },
            title: { type: "string", example: "New request" },
            body: { type: "string" },
            isRead: { type: "boolean", example: false },
            meta: {
              type: "object",
              properties: {
                projectId: { type: "string" },
                collabRequestId: { type: "string" },
              },
            },
            readAt: { type: "string", format: "date-time", nullable: true },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            purgeAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "User",
        description: "User management endpoints",
      },
      {
        name: "Waitlist",
        description: "Waitlist management endpoints",
      },
      {
        name: "Projects",
        description: "Project management endpoints",
      },
      {
        name: "Feed",
        description: "Ideas feed endpoints (cached with Redis)",
      },
      {
        name: "Collaboration Requests",
        description: "Collaboration request management endpoints",
      },
      {
        name: "Notifications",
        description: "In-app notification inbox, unread count, and read/delete actions",
      },
    ],
  },
  apis: ["./src/modules/**/*.swagger.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
