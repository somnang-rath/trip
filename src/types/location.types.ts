import type { User } from './auth.types';

export interface MemberLocation {
  _id: string;
  user: User;
  group: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
}
