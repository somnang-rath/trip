import type { User } from './auth.types';

export interface Pin {
  _id: string;
  group: string;
  createdBy: User;
  latitude: number;
  longitude: number;
  label?: string;
  createdAt: string;
  updatedAt: string;
}
