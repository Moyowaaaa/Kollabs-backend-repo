import type { NextFunction, Response } from "express";

import { IError } from "../../interfaces/error.interface";
import { AuthenticatedRequest } from "../auth/auth.interface";
import NotificationsModel from "./notifications.model";
import { createNotification } from "./notification.service";

// //createNotification
// export const createNotification = async(req:AuthenticatedRequest, res:Response, nest:NextFunction) => {
//     try {
//         const {_id} = req.user
//         const {title, body, type} = req.body as ICreateNotification

//     } catch (error) {

//     }

// }

//Create User Test notification
export const createTestNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user;
    const notification = await createNotification({
      title: "A test notification",
      body: "This is a test notification.",
      recipientId: _id,
      actorId: _id,
      type: "test",
      meta: {},
    });
    res.status(200).json({
      message: "Test notification created successfully",
      notification,
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message =
      err.message || "An error occurred while creating users notifications";
    return next(err);
  }
};

//Get Users Notifications
export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user;

    const limit = Number(req.query.limit) || 15;
    const page = Number(req.query.page) || 1;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = { recipientId: _id, deletedAt: null };

    const [notifications, totalNotifications] = await Promise.all([
      NotificationsModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      NotificationsModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      notifications,
      pagination: {
        totalNotifications,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching users notifications";
    return next(err);
  }
};

//Get single notification

export const getSingleNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user;
    const { notificationId } = req.params;
    const notification = await NotificationsModel.findOne({
      _id: notificationId,
      recipientId: _id,
      deletedAt: null,
    });

    if (!notification) {
      res.status(404).json({ message: "User notification not found" });
      return;
    }

    res.status(200).json({
      message: "Notification found",
      notification,
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching users notifications";
    return next(err);
  }
};

//Mark Notification As Read
export const markUserNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user;
    const { notificationId } = req.params;

    const notification = await NotificationsModel.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: _id,
        deletedAt: null,
      },
      {
        $set: {
          readAt: new Date(),
          isRead: true,
        },
      },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.status(200).json({
      message: "Successfully",
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching users notifications";
    return next(err);
  }
};

//Delete Notification
export const deleteUserNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { _id } = req.user;
    const { notificationId } = req.params;
    const purgeAt = new Date();
    purgeAt.setDate(purgeAt.getDate() + 90);

    const notification = await NotificationsModel.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: _id,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
          purgeAt,
        },
      },
      { new: true },
    );
    if (!notification) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    const err = error as IError;
    err.status = 500;
    err.message = "An error occurred while fetching users notifications";
    return next(err);
  }
};
