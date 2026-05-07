import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { navigate } from '../navigation/navigationRef';

type PushType =
  | 'chat'
  | 'expense'
  | 'group_member_joined'
  | 'pin'
  | 'friend_request'
  | 'friend_accepted'
  | 'dm';

interface PushData {
  type?: PushType;
  groupId?: string;
  groupName?: string;
  // Friend-payload fields — populated only for friend_* types.
  requestId?: string;
  fromUserId?: string;
  // DM-payload fields — populated only for `dm`.
  conversationId?: string;
  fromUserName?: string;
}

function readData(notification: Notifications.Notification): PushData {
  return (notification.request.content.data ?? {}) as PushData;
}

function deepLink(data: PushData): void {
  if (!data.type) return;
  // Friend pushes deep-link to the Friends tab; the in-app banner / list state
  // already tells the user which request fired.
  if (data.type === 'friend_request' || data.type === 'friend_accepted') {
    navigate('App', { screen: 'Friends' } as never);
    return;
  }
  if (data.type === 'dm') {
    if (!data.conversationId || !data.fromUserId) return;
    navigate('DmChat', {
      conversationId: data.conversationId,
      peerId: data.fromUserId,
      peerName: data.fromUserName ?? 'Direct message',
    });
    return;
  }
  if (!data.groupId) return;
  const groupName = data.groupName ?? 'Trip';
  switch (data.type) {
    case 'chat':
      navigate('Chat', { groupId: data.groupId, groupName });
      break;
    case 'expense':
      navigate('Expenses', { groupId: data.groupId, groupName });
      break;
    case 'group_member_joined':
      navigate('GroupDetail', { groupId: data.groupId });
      break;
    case 'pin':
      navigate('Map', { groupId: data.groupId, groupName });
      break;
  }
}

/**
 * Wires up Expo notification listeners for the lifetime of the app:
 *
 *   • Tap (warm or cold-start) → deep-link to the right screen via the
 *     navigation ref.
 *   • Arrival while app is in foreground → invalidate the React Query
 *     caches that the new push affects, so the open screen reflects it
 *     without a manual refresh.
 */
export function usePushNotificationHandlers(): void {
  const queryClient = useQueryClient();

  // ── Tap handler (works for warm taps AND cold-start because
  // useLastNotificationResponse returns the most recent response on mount).
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    deepLink(readData(lastResponse.notification));
  }, [lastResponse]);

  // ── Foreground arrival → cache invalidation
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = readData(notification);

      // Friend pushes invalidate the friends namespace so the right counts
      // appear on the next render of the Friends tab.
      if (
        data.type === 'friend_request' ||
        data.type === 'friend_accepted'
      ) {
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        return;
      }

      // DM pushes refresh the inbox preview/unread counts. The open thread
      // (if any) is already getting the live message via the DM socket.
      if (data.type === 'dm') {
        queryClient.invalidateQueries({ queryKey: ['dm', 'conversations'] });
        if (data.conversationId) {
          queryClient.invalidateQueries({
            queryKey: ['dm', 'messages', data.conversationId],
          });
        }
        return;
      }

      if (!data.groupId) return;

      switch (data.type) {
        case 'chat':
          // The socket already pushes the message live — but invalidate as a
          // safety net in case the device's socket got reconnected after a
          // disconnect and missed the in-flight broadcast.
          queryClient.invalidateQueries({ queryKey: ['messages', data.groupId] });
          break;
        case 'expense':
          queryClient.invalidateQueries({ queryKey: ['expenses', data.groupId] });
          queryClient.invalidateQueries({ queryKey: ['expenses-summary', data.groupId] });
          break;
        case 'group_member_joined':
          queryClient.invalidateQueries({ queryKey: ['groups', data.groupId] });
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          break;
        case 'pin':
          // Socket already broadcast pin:new — invalidate as a safety net in
          // case the device's location socket missed the event mid-reconnect.
          queryClient.invalidateQueries({ queryKey: ['pins', data.groupId] });
          break;
      }
    });
    return () => sub.remove();
  }, [queryClient]);
}
