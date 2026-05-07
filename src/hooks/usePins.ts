import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pinsApi, type CreatePinPayload } from '../api/pins.api';
import type { Pin } from '../types/pin.types';

export function usePins(groupId: string) {
  return useQuery({
    queryKey: ['pins', groupId],
    queryFn: () => pinsApi.getPins(groupId),
    enabled: !!groupId,
  });
}

export function useCreatePin(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePinPayload) => pinsApi.createPin(groupId, data),
    onSuccess: (pin) => {
      // Optimistically prepend the new pin so the marker appears even before
      // the socket broadcast lands (and stays consistent with the broadcast).
      qc.setQueryData<Pin[]>(['pins', groupId], (prev) =>
        prev ? [pin, ...prev.filter((p) => p._id !== pin._id)] : [pin],
      );
    },
  });
}

export function useDeletePin(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pinId: string) => pinsApi.deletePin(groupId, pinId),
    onSuccess: (_data, pinId) => {
      qc.setQueryData<Pin[]>(['pins', groupId], (prev) =>
        prev ? prev.filter((p) => p._id !== pinId) : prev,
      );
    },
  });
}
