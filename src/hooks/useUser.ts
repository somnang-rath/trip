import { useMutation } from '@tanstack/react-query';
import {
  usersApi,
  type ChangePasswordPayload,
  type UpdateProfilePayload,
} from '../api/users.api';
import { useAuthStore } from '../store/auth.store';

/**
 * Patch the current user's profile (name / avatar / cover image). Pushes the
 * fresh server response back into the auth store so every screen that reads
 * `user` re-renders with the new values without a refetch.
 */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => usersApi.updateProfile(data),
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => usersApi.changePassword(data),
  });
}
