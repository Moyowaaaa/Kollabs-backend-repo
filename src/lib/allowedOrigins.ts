const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.koneticus.com",
  "https://koneticus.com",
  "https://area-52.netlify.app",
];

const extraOrigins =
  process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");

export const allowedOrigins = [...DEFAULT_ORIGINS, ...extraOrigins].map(
  normalizeOrigin,
);

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
};
