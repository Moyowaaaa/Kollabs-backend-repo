import { ICreateNotificationPayload } from "./notifications.interface"
import NotificationsModel from "./notifications.model"


//create notification service

export const createNotification = async ({
  title,
  body,
  type,
  actorId,
  recipientId,
  meta = {},
}: ICreateNotificationPayload) => {
  return NotificationsModel.create({
    title,
    body,
    type,
    actorId,
    recipientId,
    meta,
  });
};