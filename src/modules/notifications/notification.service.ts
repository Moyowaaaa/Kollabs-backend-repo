import logger from "../../lib/log/winston.log";
import { ICreateNotificationPayload } from "./notifications.interface";
import NotificationsModel from "./notifications.model";

/**
 * Creates a notification. Never throws — callers (collab accept/reject/etc.)
 * must not fail if notify persistence fails.
 */
export const createNotification = async ({
  title,
  body,
  type,
  actorId,
  recipientId,
  meta = {},
}: ICreateNotificationPayload) => {
  try {
    return await NotificationsModel.create({
      title,
      body,
      type,
      actorId,
      recipientId,
      meta,
    });
  } catch (error) {
    logger.error("Failed to create notification", {
      type,
      recipientId,
      actorId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};
