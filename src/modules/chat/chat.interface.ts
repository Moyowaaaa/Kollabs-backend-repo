export type ConversationType = "dm" | "group" | "kollaboration";

export type ConversationMemberRole = "owner" | "admin" | "member";

export type MessageType = "text" | "attachment" | "poll" | "system";

export type AttachmentKind = "photo" | "video" | "document" | "audio";

export interface IConversationMember {
  userId: string;
  role: ConversationMemberRole;
  joinedAt: Date;
  unreadCount: number;
  lastReadAt: Date | null;
  isMuted: boolean;
  isArchived: boolean;
  /** Set when a user leaves a group / kollaboration; DMs typically stay open */
  leftAt: Date | null;
}

export interface IConversationLastMessage {
  text?: string;
  senderId: string;
  type: MessageType;
  createdAt: Date;
}

export interface IConversationAvatar {
  url: string;
  id: string;
}

export interface IConversation {
  _id: string;
  type: ConversationType;
  /** Denormalized member ids for fast membership queries / indexes */
  participantIds: string[];
  members: IConversationMember[];
  /** Required for group; optional for kollaboration (can fall back to project title) */
  name?: string;
  avatar?: IConversationAvatar | null;
  createdBy: string;
  /** Required when type is kollaboration */
  projectId?: string | null;
  /**
   * Sorted "userA_userB" key for DM uniqueness.
   * Null for group / kollaboration.
   */
  dmKey?: string | null;
  lastMessage?: IConversationLastMessage | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageAttachment {
  url: string;
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  thumbnail?: string;
}

export interface IPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface IMessagePoll {
  question: string;
  options: IPollOption[];
  allowMultiple: boolean;
  isAnonymous: boolean;
  isClosed: boolean;
  closesAt?: Date | null;
}

export interface IMessageReadReceipt {
  userId: string;
  readAt: Date;
}

export interface IMessageReaction {
  /** Unique reaction instance id (useful for delete / optimistic updates) */
  id: string;
  userId: string;
  emoji: string;
  reactedAt: Date;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  /** Plain text body; emojis are stored inline as Unicode */
  content?: string;
  attachments?: IMessageAttachment[];
  poll?: IMessagePoll;
  readBy: IMessageReadReceipt[];
  reactions?: IMessageReaction[];
  /** e.g. member_joined, member_left, poll_closed — used when type is system */
  systemEvent?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Start a 1:1 DM with another user (idempotent via dmKey) */
export interface ICreateDmPayload {
  recipientId: string;
}

/** Create a named group chat */
export interface ICreateGroupPayload {
  name: string;
  /** Array of user ids, or a JSON string / comma-separated list when using multipart form-data */
  memberIds: string[] | string;
  /** Optional pre-uploaded avatar; prefer uploading via multipart field `avatar` */
  avatar?: IConversationAvatar;
}

/** Create or ensure a project-linked Kollaboration chat */
export interface ICreateKollaborationPayload {
  projectId: string;
  name?: string;
  memberIds: string[];
}

export interface ISendMessagePayload {
  conversationId: string;
  type?: MessageType;
  content?: string;
  attachments?: IMessageAttachment[];
  poll?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    isAnonymous?: boolean;
    closesAt?: Date | null;
  };
}

/** Add or change the caller's reaction on a message */
export interface IReactToMessagePayload {
  emoji: string;
}

export interface IVotePollPayload {
  messageId: string;
  optionIds: string[];
}
