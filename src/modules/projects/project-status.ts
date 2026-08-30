/** Active product pipeline (excludes soft-delete lifecycle). */
export const PROJECT_PIPELINE_STATUSES = [
  "draft",
  "seeking_collaborators",
  "ongoing",
  "completed",
] as const;

export type ProjectPipelineStatus = (typeof PROJECT_PIPELINE_STATUSES)[number];

/** Stored on documents (includes soft-delete / archive). */
export const PROJECT_STATUS_ENUM = [
  ...PROJECT_PIPELINE_STATUSES,
  "deleted",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_ENUM)[number];

export const PUBLIC_FEED_STATUSES = [
  "draft",
  "seeking_collaborators",
  "ongoing",
  "completed",
] as const;

export const TRENDING_FEED_STATUSES = [
  "seeking_collaborators",
  "ongoing",
  "completed",
] as const;

/** Statuses that accept Show Interest / collab requests. */
export const COLLAB_REQUESTABLE_STATUSES = [
  "seeking_collaborators",
] as const;

const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["seeking_collaborators"],
  seeking_collaborators: ["ongoing", "draft"],
  ongoing: ["completed", "seeking_collaborators"],
  completed: ["ongoing"],
};

/** Normalize status values (legacy `pending` → seeking_collaborators). */
export const normalizeProjectStatus = (status: string): string => {
  if (status === "pending") return "seeking_collaborators";
  return status;
};

export const isCollabRequestableStatus = (status: string): boolean =>
  (COLLAB_REQUESTABLE_STATUSES as readonly string[]).includes(status);

export const canTransitionProjectStatus = (
  from: string,
  to: string,
): boolean => {
  if (from === to) return true;
  const normalizedFrom = normalizeProjectStatus(from);
  const allowed = ALLOWED_TRANSITIONS[normalizedFrom];
  if (!allowed) return false;
  return allowed.includes(to);
};
