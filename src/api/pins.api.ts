import { api } from './client';
import type { Pin } from '../types/pin.types';

export interface CreatePinPayload {
  latitude: number;
  longitude: number;
  label?: string;
}

export const pinsApi = {
  getPins: (groupId: string) =>
    api.get<Pin[]>(`/groups/${groupId}/pins`).then((r) => r.data),

  createPin: (groupId: string, data: CreatePinPayload) =>
    api.post<Pin>(`/groups/${groupId}/pins`, data).then((r) => r.data),

  deletePin: (groupId: string, pinId: string) =>
    api.delete(`/groups/${groupId}/pins/${pinId}`),
};
