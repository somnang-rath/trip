import { api } from './client';
import type { User } from '../types/auth.types';

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string | null;
  coverImage?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  updateProfile: (data: UpdateProfilePayload) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  changePassword: (data: ChangePasswordPayload) =>
    api.patch('/users/me/password', data),
};
