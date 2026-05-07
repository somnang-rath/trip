import { api } from './client';
import type { Friendship, UserSearchResult } from '../types/friend.types';

export const friendsApi = {
  list: () => api.get<Friendship[]>('/friends').then((r) => r.data),

  search: (q: string) =>
    api
      .get<UserSearchResult[]>('/friends/search', { params: { q } })
      .then((r) => r.data),

  listRequests: (box: 'incoming' | 'outgoing') =>
    api
      .get<Friendship[]>('/friends/requests', { params: { box } })
      .then((r) => r.data),

  sendRequest: (recipientId: string) =>
    api
      .post<Friendship>('/friends/requests', { recipientId })
      .then((r) => r.data),

  acceptRequest: (id: string) =>
    api
      .post<Friendship>(`/friends/requests/${id}/accept`)
      .then((r) => r.data),

  declineRequest: (id: string) =>
    api.post(`/friends/requests/${id}/decline`),

  cancelRequest: (id: string) => api.delete(`/friends/requests/${id}`),

  unfriend: (userId: string) => api.delete(`/friends/${userId}`),

  listBlocked: () => api.get<Friendship[]>('/friends/blocks').then((r) => r.data),

  block: (userId: string) =>
    api.post<Friendship>('/friends/blocks', { userId }).then((r) => r.data),

  unblock: (userId: string) => api.delete(`/friends/blocks/${userId}`),
};
