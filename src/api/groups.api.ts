import { api } from './client';
import type { Group } from '../types/group.types';

export const groupsApi = {
  getMyGroups: () => api.get<Group[]>('/groups').then((r) => r.data),

  getMyArchivedGroups: () =>
    api.get<Group[]>('/groups/archived').then((r) => r.data),

  getGroup: (id: string) => api.get<Group>(`/groups/${id}`).then((r) => r.data),

  createGroup: (data: Partial<Group>) =>
    api.post<Group>('/groups', data).then((r) => r.data),

  updateGroup: (id: string, data: Partial<Group>) =>
    api.patch<Group>(`/groups/${id}`, data).then((r) => r.data),

  deleteGroup: (id: string) => api.delete(`/groups/${id}`),

  joinGroup: (inviteCode: string) =>
    api.post<Group>('/groups/join', { inviteCode }).then((r) => r.data),

  leaveGroup: (id: string) => api.post(`/groups/${id}/leave`),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),

  regenerateInviteCode: (groupId: string) =>
    api.post<Group>(`/groups/${groupId}/regenerate-invite`).then((r) => r.data),

  archiveGroup: (groupId: string) =>
    api.post<Group>(`/groups/${groupId}/archive`).then((r) => r.data),

  unarchiveGroup: (groupId: string) =>
    api.post<Group>(`/groups/${groupId}/unarchive`).then((r) => r.data),

  addItineraryItem: (groupId: string, data: Record<string, unknown>) =>
    api.post<Group>(`/groups/${groupId}/itinerary`, data).then((r) => r.data),

  updateItineraryItem: (groupId: string, itemId: string, data: Record<string, unknown>) =>
    api.patch<Group>(`/groups/${groupId}/itinerary/${itemId}`, data).then((r) => r.data),

  deleteItineraryItem: (groupId: string, itemId: string) =>
    api.delete(`/groups/${groupId}/itinerary/${itemId}`),
};
