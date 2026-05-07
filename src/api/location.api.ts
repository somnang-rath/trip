import { api } from './client';
import type { MemberLocation } from '../types/location.types';

export const locationApi = {
  getGroupLocations: (groupId: string) =>
    api.get<MemberLocation[]>(`/location/${groupId}`).then((r) => r.data),
};
