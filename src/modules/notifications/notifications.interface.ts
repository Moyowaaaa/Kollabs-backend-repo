export interface INotification {
  _id: string;
  recipientId: string;
  actorId: string;
  type:
    | "test"
    | "project_created"
    | "project_updated"
    | "project_deleted"
    | "project_archived"
    | "project_unarchived"
    | "project_completed"
    | "project_uncompleted"
    | "collab_request_received"
    | "collab_request_accepted";
  title: string;
  body: string;
  isRead: boolean;
  meta: {
    projectId?: string;
    collabRequestId?: string;
  };
  readAt: Date | null;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}



export interface ICreateNotificationPayload {
  recipientId: string;
  actorId?: string;
  type: string;
  title: string;
  body?: string;
  meta: {
    projectId?: string;
    collabRequestId?: string;
  };
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}