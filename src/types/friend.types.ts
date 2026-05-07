import type { User } from './auth.types';

/** Mirrors backend FriendshipStatus. */
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

/**
 * What the search endpoint annotates each user row with so the UI can render
 * the right action (Send / Cancel / Accept / Already friends / Blocked).
 */
export type RelationStatus =
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'friends'
  | 'blocked_by_me';

export interface FriendUserRef {
  _id: string;
  name: string;
  email?: string;
  avatar: string | null;
}

/** Row shape returned by `/friends`, `/friends/requests`, `/friends/blocks`. */
export interface Friendship {
  _id: string;
  requester: FriendUserRef;
  recipient: FriendUserRef;
  status: FriendshipStatus;
  blockedBy?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResult {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: RelationStatus;
}
