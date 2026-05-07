import { api } from './client';
import type { Message } from '../types/chat.types';

export const chatApi = {
  getMessages: (groupId: string, limit = 50, before?: string) => {
    const params: Record<string, string | number> = { limit };
    if (before) params.before = before;
    return api.get<Message[]>(`/chat/${groupId}/messages`, { params }).then((r) => r.data);
  },
  getPinned: (groupId: string) =>
    api.get<Message[]>(`/chat/${groupId}/pinned`).then((r) => r.data),
};
