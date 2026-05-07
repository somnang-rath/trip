import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { RootNavProp } from '../../navigation/types';
import { useDmConversations, useMarkDmRead } from '../../hooks/useDm';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { DmConversationRow } from '../../components/chat/DmConversationRow';
import type { DmConversation, DmMessage } from '../../types/dm.types';

export function DmInboxScreen() {
  const navigation = useNavigation<RootNavProp>();
  const me = useAuthStore((s) => s.user);
  const dmSocket = useSocketStore((s) => s.dmSocket);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useDmConversations();
  const markRead = useMarkDmRead();

  // Foreground updates: any new DM bumps lastMessage/unread on the
  // conversation, so invalidate the inbox query whenever a message arrives
  // for any thread the user is in. This is broader than the per-thread
  // listener inside DmChatScreen — it covers the case where the user is on
  // the inbox screen and a message arrives in a thread they aren't viewing.
  useEffect(() => {
    if (!dmSocket) return;
    const onIncoming = (_msg: DmMessage) => {
      void qc.invalidateQueries({ queryKey: ['dm', 'conversations'] });
    };
    dmSocket.on('message:new', onIncoming);
    return () => {
      dmSocket.off('message:new', onIncoming);
    };
  }, [dmSocket, qc]);

  function handleOpen(conv: DmConversation) {
    if (!me) return;
    const peer = conv.participants.find((p) => p._id !== me._id);
    if (!peer) return;
    // Mark read up-front so the badge clears even before the WS connects.
    markRead.mutate(conv._id);
    navigation.navigate('DmChat', {
      conversationId: conv._id,
      peerId: peer._id,
      peerName: peer.name,
    });
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-light dark:bg-bg-dark">
      <View className="px-5 pt-2 pb-3">
        <Text className="text-slate-900 dark:text-white text-2xl font-extrabold">
          Chats
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Direct messages with your friends.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="flex-1" color="#6366f1" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c._id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-border-light dark:bg-border-dark ml-[76px]" />
          )}
          ListEmptyComponent={
            <View className="items-center mt-20 px-8">
              <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                <MessageCircle size={28} color="#94a3b8" />
              </View>
              <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
                No messages yet
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
                Open the Friends tab and tap a friend to start a conversation.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = me ? (item.unread?.[me._id] ?? 0) : 0;
            return (
              <DmConversationRow
                conversation={item}
                myUserId={me?._id ?? ''}
                unread={unread}
                onPress={() => handleOpen(item)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
