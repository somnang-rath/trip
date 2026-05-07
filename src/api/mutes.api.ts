import { api } from './client';

export interface MutedGroup {
  group: string;
  /** ISO timestamp; null means muted indefinitely. */
  until: string | null;
}

export const mutesApi = {
  list: () => api.get<MutedGroup[]>('/users/me/muted-groups').then((r) => r.data),

  /** Pass `until` as an ISO string, or null for "until I unmute". */
  mute: (groupId: string, until: string | null) =>
    api
      .put(`/users/me/muted-groups/${groupId}`, { until })
      .then((r) => r.data),

  unmute: (groupId: string) =>
    api.delete(`/users/me/muted-groups/${groupId}`).then((r) => r.data),
};
