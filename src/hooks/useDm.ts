import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dmApi } from '../api/dm.api';

const KEYS = {
  conversations: ['dm', 'conversations'] as const,
  conversation: (id: string) => ['dm', 'conversations', id] as const,
  messages: (id: string) => ['dm', 'messages', id] as const,
};

// Queries ────────────────────────────────────────────────────────────────

export function useDmConversations() {
  return useQuery({
    queryKey: KEYS.conversations,
    queryFn: dmApi.listConversations,
  });
}

export function useDmConversation(id: string) {
  return useQuery({
    queryKey: KEYS.conversation(id),
    queryFn: () => dmApi.getConversation(id),
    enabled: !!id,
  });
}

export function useDmMessages(id: string) {
  return useQuery({
    queryKey: KEYS.messages(id),
    queryFn: () => dmApi.getMessages(id),
    enabled: !!id,
  });
}

// Mutations ──────────────────────────────────────────────────────────────

/**
 * Open-or-fetch a DM with a peer. Idempotent on the server, so calling this
 * from the Friends tab "Message" button safely round-trips to the existing
 * conversation if one already exists.
 */
export function useOpenDmConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (peerId: string) => dmApi.open(peerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.conversations }),
  });
}

/**
 * Reset the unread badge for a conversation. The DM gateway does this on
 * `message:read`, but the inbox row also calls it on tap so the badge clears
 * even if the user opens a thread before the first message socket fires.
 */
export function useMarkDmRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dmApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.conversations }),
  });
}
