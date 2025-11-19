# Vision Forge Backend

This repository contains the backend code for Vision Forge, a web development project. The backend is structured using Node.js and TypeScript, and is designed to be modular, scalable, and maintainable.

## Table of Contents

- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Setup & Installation](#setup--installation)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Logging](#logging)
- [Database](#database)
- [Error Handling](#error-handling)
- [Cloudinary Integration](#cloudinary-integration)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

Vision Forge Backend provides RESTful APIs and core business logic for the Vision Forge platform. It is built with TypeScript for type safety and maintainability, and uses Express.js for HTTP server functionality.

## Directory Structure

```
backend/
├── nodemon.json           # Nodemon configuration for development
├── package.json           # Project metadata and scripts
├── tsconfig.json          # TypeScript configuration
├── logs/                  # Application logs
├── src/
│   ├── server.ts          # Entry point for the server
│   ├── db/
│   │   └── db.ts          # Database connection and setup
│   ├── interfaces/
│   │   └── error.interface.ts # Error interface definitions
│   ├── lib/
│   │   └── log/
│   │       ├── morgan.log.ts  # Morgan logging setup
│   │       └── winston.log.ts # Winston logging setup
│   ├── middleware/
│   │   └── ErrorLogger.ts     # Error logging middleware
│   ├── models/
│   │   └── error.model.ts     # Error model definitions
│   ├── modules/               # Business logic modules (expandable)
│   ├── routes/                # API route definitions
│   ├── utils/
│   │   └── cloudinary.ts      # Cloudinary utility functions
```

### Key Folders

- **src/**: Main source code for the backend.
- **db/**: Database connection and configuration.
- **interfaces/**: TypeScript interfaces for type safety.
- **lib/log/**: Logging utilities using Morgan and Winston.
- **middleware/**: Custom Express middleware (e.g., error logging).
- **models/**: Data models and schemas.
- **modules/**: Core business logic modules (expandable).
- **routes/**: API route handlers.
- **utils/**: Utility functions (e.g., Cloudinary integration).
- **logs/**: Stores application logs.

## Setup & Installation

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/Moyowaaaa/Kollabs-backend-repo.git
   cd backend
   ```
2. **Install dependencies:**
   ```powershell
   npm install
   ```
3. **Configure environment variables:**

   - Create a `.env` file in the root directory and add necessary environment variables (e.g., database URI, Cloudinary credentials).

4. **Run the development server:**
   ```powershell
   npm run dev
   ```

## Scripts

- `npm run dev`: Starts the server with Nodemon for hot-reloading.
- `npm start`: Starts the server in production mode.
- `npm run build`: Compiles TypeScript to JavaScript.

## Configuration

- **nodemon.json**: Configures Nodemon for development auto-reloading.
- **tsconfig.json**: TypeScript compiler options.
- **package.json**: Project dependencies and scripts.

## Logging

- **Morgan**: HTTP request logging (see `lib/log/morgan.log.ts`).
- **Winston**: General application logging (see `lib/log/winston.log.ts`).
- **logs/**: Directory for log files.

## Database

- Database connection and setup are managed in `src/db/db.ts`.
- Supports environment-based configuration via `.env`.

## Error Handling

- Error interfaces: `src/interfaces/error.interface.ts`
- Error models: `src/models/error.model.ts`
- Error logging middleware: `src/middleware/ErrorLogger.ts`

## Cloudinary Integration

- Utility functions for Cloudinary are in `src/utils/cloudinary.ts`.
- Used for image and asset management.

## Development Workflow

- Use feature branches for new features and bug fixes.
- Pull requests should be submitted to the `dev` branch.
- CI/CD is configured via GitHub Actions (`.github/workflows/ci.yml`).

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes.
4. Push to your branch and open a pull request.

## License

This project is licensed under the MIT License.

---

For questions or support, please open an issue or contact the repository owner.
