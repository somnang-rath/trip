import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';
import { saveRefreshToken, deleteRefreshToken } from '../utils/token';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../utils/pushNotifications';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const { connectChat, connectLocation, connectDm } = useSocketStore();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken);
      await saveRefreshToken(refreshToken);
      connectChat(accessToken);
      connectLocation(accessToken);
      connectDm(accessToken);
      // Fire-and-forget — push registration must not block sign-in even
      // if the device denies permission or the network is flaky.
      registerForPushNotifications().catch(() => {});
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const { connectChat, connectLocation, connectDm } = useSocketStore();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken);
      await saveRefreshToken(refreshToken);
      connectChat(accessToken);
      connectLocation(accessToken);
      connectDm(accessToken);
      registerForPushNotifications().catch(() => {});
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const { disconnectAll } = useSocketStore();

  return useMutation({
    mutationFn: async () => {
      // Drop the push token *before* invalidating the session — once auth is
      // cleared the request would 401 and the token would linger on the user.
      await unregisterPushNotifications();
      return authApi.logout();
    },
    onSettled: async () => {
      disconnectAll();
      clearAuth();
      await deleteRefreshToken();
    },
  });
}
