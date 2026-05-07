import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutesApi, type MutedGroup } from '../api/mutes.api';

const KEY = ['muted-groups'];

export function useMyMutes() {
  return useQuery({
    queryKey: KEY,
    queryFn: mutesApi.list,
  });
}

/**
 * Returns whether a specific group is currently muted, plus the expiry (or
 * null for indefinite). Wraps the cached list so multiple components share
 * one network request.
 */
export function useGroupMute(groupId: string): {
  isMuted: boolean;
  until: Date | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useMyMutes();
  const entry = data?.find((m) => m.group === groupId);
  if (!entry) return { isMuted: false, until: null, isLoading };
  if (entry.until && new Date(entry.until) <= new Date()) {
    return { isMuted: false, until: null, isLoading };
  }
  return { isMuted: true, until: entry.until ? new Date(entry.until) : null, isLoading };
}

export function useMuteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, until }: { groupId: string; until: Date | null }) =>
      mutesApi.mute(groupId, until ? until.toISOString() : null),
    onMutate: async ({ groupId, until }) => {
      // Optimistic — flip the bell immediately, no network wait.
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<MutedGroup[]>(KEY) ?? [];
      const next: MutedGroup[] = [
        ...previous.filter((m) => m.group !== groupId),
        { group: groupId, until: until ? until.toISOString() : null },
      ];
      qc.setQueryData(KEY, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUnmuteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => mutesApi.unmute(groupId),
    onMutate: async (groupId) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<MutedGroup[]>(KEY) ?? [];
      qc.setQueryData(
        KEY,
        previous.filter((m) => m.group !== groupId),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
