import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api';
import type { Group } from '../types/group.types';

export function useMyGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getMyGroups,
  });
}

export function useMyArchivedGroups() {
  return useQuery({
    queryKey: ['groups', 'archived'],
    queryFn: groupsApi.getMyArchivedGroups,
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.getGroup(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => groupsApi.joinGroup(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useUpdateGroup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Group>) => groupsApi.updateGroup(groupId, data),
    // Optimistic update so toggles feel instant; rollback on error.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['groups', groupId] });
      const previous = qc.getQueryData<Group>(['groups', groupId]);
      if (previous) {
        qc.setQueryData<Group>(['groups', groupId], { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(['groups', groupId], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    onSuccess: (_data, groupId) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      // Drop the cached detail so a stale ForbiddenException doesn't flash if
      // the user navigates back into it before invalidation completes.
      qc.removeQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}

export function useRegenerateInviteCode(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => groupsApi.regenerateInviteCode(groupId),
    onSuccess: (group) => {
      // Patch the detail cache directly so the new code shows instantly
      // without waiting for a refetch.
      qc.setQueryData(['groups', groupId], group);
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useArchiveGroup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => groupsApi.archiveGroup(groupId),
    onSuccess: () => {
      // Both the active list and the archived list change; nuke detail too
      // so a re-open re-fetches with the new status.
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['groups', 'archived'] });
      qc.removeQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useUnarchiveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.unarchiveGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['groups', 'archived'] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.deleteGroup(groupId),
    onSuccess: (_data, groupId) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['groups', 'archived'] });
      qc.removeQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useAddItineraryItem(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      groupsApi.addItineraryItem(groupId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}
