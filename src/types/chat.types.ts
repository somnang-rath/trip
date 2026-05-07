import type { User } from './auth.types';

export type MessageType = 'text' | 'image' | 'video' | 'system';

export interface Reaction {
  user: string;
  emoji: string;
  createdAt: string;
}

/**
 * Reduced shape used as `Message.replyTo` — populated server-side with just
 * enough to render a quote header without a follow-up fetch.
 */
export interface ReplyPreview {
  _id: string;
  sender: Pick<User, '_id' | 'name' | 'avatar'>;
  content: string;
  type: MessageType;
  mediaUrl?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Message {
  _id: string;
  group: string;
  sender: User;
  content: string;
  type: MessageType;
  mediaUrl?: string | null;
  mediaThumb?: string | null;
  readBy: string[];
  reactions: Reaction[];
  replyTo?: ReplyPreview | null;
  forwardedFrom?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  pinned: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | { _id: string; name: string } | null;
  createdAt: string;

  // Client-only fields. Set on optimistic local bubbles; cleared/ignored once
  // the server-issued message replaces them.
  optimisticId?: string;
  sending?: boolean;
  sendFailed?: boolean;
  /**
   * Captured at the moment of send so a failed bubble can be retried without
   * re-running the picker / compression pipeline.
   */
  pendingPayload?: PendingSendPayload;
}

export interface PendingSendPayload {
  type: MessageType;
  content: string;
  mediaUrl?: string | null;
  mediaThumb?: string | null;
  replyTo?: string | null;
}
