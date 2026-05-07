import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends.api';

const KEYS = {
  friends: ['friends'] as const,
  blocked: ['friends', 'blocked'] as const,
  requests: (box: 'incoming' | 'outgoing') =>
    ['friends', 'requests', box] as const,
  search: (q: string) => ['friends', 'search', q] as const,
};

/**
 * Anything that mutates a relation can affect every list (friends list, both
 * request boxes, blocked list, and any in-flight search results), so we
 * invalidate the whole `friends` namespace on success rather than tracking
 * surgical patches per mutation.
 */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['friends'] });
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useFriendsList() {
  return useQuery({
    queryKey: KEYS.friends,
    queryFn: friendsApi.list,
  });
}

export function useFriendRequests(box: 'incoming' | 'outgoing') {
  return useQuery({
    queryKey: KEYS.requests(box),
    queryFn: () => friendsApi.listRequests(box),
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: KEYS.blocked,
    queryFn: friendsApi.listBlocked,
  });
}

export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: KEYS.search(trimmed),
    queryFn: () => friendsApi.search(trimmed),
    enabled: trimmed.length >= 2,
    // Search is cheap and the user expects fresh status on every keystroke
    // (e.g. "Pending" badge after they tap Add). 5s is enough to coalesce
    // back-to-back queries without serving stale relation flags.
    staleTime: 5_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipientId: string) => friendsApi.sendRequest(recipientId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.acceptRequest(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.declineRequest(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCancelFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.cancelRequest(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUnfriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.unfriend(userId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.block(userId),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.unblock(userId),
    onSuccess: () => invalidateAll(qc),
  });
}
