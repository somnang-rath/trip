import type { User } from './auth.types';
import type { Reaction, ReplyPreview, MessageType } from './chat.types';

/** Mirrors the backend `DirectMessage` schema. */
export interface DmMessage {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  type: MessageType;
  mediaUrl?: string | null;
  mediaThumb?: string | null;
  readBy: string[];
  reactions: Reaction[];
  replyTo?: ReplyPreview | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;

  // Client-only optimistic-send fields. Mirror the chat `Message` shape so the
  // DM screen can drive the same MessageBubble UI.
  optimisticId?: string;
  sending?: boolean;
  sendFailed?: boolean;
  pendingPayload?: PendingDmSendPayload;
}

export interface PendingDmSendPayload {
  type: MessageType;
  content: string;
  mediaUrl?: string | null;
  mediaThumb?: string | null;
  replyTo?: string | null;
}

/** Reduced shape used when rendering the inbox row. */
export interface DmConversationLastMessage {
  _id: string;
  sender: Pick<User, '_id' | 'name' | 'avatar'>;
  content: string;
  type: MessageType;
  mediaUrl?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

/**
 * `unread` is serialized as a plain object keyed by userId — mongoose Maps
 * round-trip to JSON as `{ [key]: value }`.
 */
export interface DmConversation {
  _id: string;
  participants: Pick<User, '_id' | 'name' | 'avatar'>[];
  pairKey: string;
  lastMessage?: DmConversationLastMessage | null;
  lastMessageAt?: string | null;
  unread: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}
