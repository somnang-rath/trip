import { api } from './client';
import type { DmConversation, DmMessage } from '../types/dm.types';

export const dmApi = {
  listConversations: () =>
    api.get<DmConversation[]>('/dm/conversations').then((r) => r.data),

  open: (peerId: string) =>
    api
      .post<DmConversation>('/dm/conversations', { peerId })
      .then((r) => r.data),

  getConversation: (id: string) =>
    api.get<DmConversation>(`/dm/conversations/${id}`).then((r) => r.data),

  getMessages: (id: string, limit = 50, before?: string) =>
    api
      .get<DmMessage[]>(`/dm/conversations/${id}/messages`, {
        params: { limit, before },
      })
      .then((r) => r.data),

  markRead: (id: string) =>
    api.post(`/dm/conversations/${id}/read`),
};
