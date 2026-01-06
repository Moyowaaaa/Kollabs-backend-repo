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
          description: "Enter your JWT token",
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
          properties: {
            message: {
              type: "string",
              description: "Response message",
            },
            token: {
              type: "string",
              description: "JWT authentication token",
            },
          },
        },
        UserLinks: {
          type: "object",
          properties: {
            twitter: { type: "string" },
            instagram: { type: "string" },
            linkedin: { type: "string" },
            website: { type: "string" },
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
    ],
  },
  apis: ["./src/modules/**/*.swagger.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
