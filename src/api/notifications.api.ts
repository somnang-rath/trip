import { api } from './client';

export const notificationsApi = {
  registerPushToken: (token: string) =>
    api.post('/users/me/push-token', { token }).then((r) => r.data),

  removePushToken: (token: string) =>
    api.delete('/users/me/push-token', { data: { token } }).then((r) => r.data),
};
