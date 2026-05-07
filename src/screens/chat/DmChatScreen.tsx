import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RootStackParams } from '../../navigation/types';
import { dmApi } from '../../api/dm.api';
import { useSocketStore } from '../../store/socket.store';
import { useAuthStore } from '../../store/auth.store';
import { MessageBubble } from '../../components/chat/MessageBubble';
import {
  MessageInput,
  type SendPayload,
  type EditPayload,
} from '../../components/chat/MessageInput';
import { MessageActionSheet } from '../../components/chat/MessageActionSheet';
import type { Message } from '../../types/chat.types';
import type { DmMessage, PendingDmSendPayload } from '../../types/dm.types';

type Route = RouteProp<RootStackParams, 'DmChat'>;

const SEND_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 50;

function newOptimisticId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Adapt a DM message to the `Message` shape that MessageBubble + ActionSheet
 * expect. We stuff the conversationId into `group` (purely as an opaque
 * identifier — the bubble only renders fields that exist on both schemas)
 * and force `pinned`/`forwardedFrom` defaults DM doesn't expose.
 */
function toMessageShape(dm: DmMessage, conversationId: string): Message {
  return {
    _id: dm._id,
    group: conversationId,
    sender: dm.sender,
    content: dm.content,
    type: dm.type,
    mediaUrl: dm.mediaUrl ?? null,
    mediaThumb: dm.mediaThumb ?? null,
    readBy: dm.readBy,
    reactions: dm.reactions,
    replyTo: dm.replyTo ?? null,
    forwardedFrom: null,
    editedAt: dm.editedAt ?? null,
    deletedAt: dm.deletedAt ?? null,
    pinned: false,
    pinnedAt: null,
    pinnedBy: null,
    createdAt: dm.createdAt,
    optimisticId: dm.optimisticId,
    sending: dm.sending,
    sendFailed: dm.sendFailed,
  };
}

export function DmChatScreen() {
  const { params } = useRoute<Route>();
  const { conversationId } = params;
  const user = useAuthStore((s) => s.user);
  const dmSocket = useSocketStore((s) => s.dmSocket);
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [typingActive, setTypingActive] = useState(false);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  // FlatList renders adapted `Message`-shaped items (see `adapted` below) —
  // the underlying DmMessage[] is kept as a sibling state for socket bookkeeping.
  const listRef = useRef<FlatList<Message>>(null);
  const historyLoaded = useRef(false);
  const sendTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data: history, isLoading } = useQuery({
    queryKey: ['dm', 'messages', conversationId],
    queryFn: () => dmApi.getMessages(conversationId),
  });

  useEffect(() => {
    if (history && !historyLoaded.current) {
      historyLoaded.current = true;
      setMessages([...history].reverse());
      if (history.length < PAGE_SIZE) setHasMoreHistory(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [history]);

  // Cleanup pending-send timeouts on unmount.
  useEffect(() => {
    const map = sendTimeouts.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  useEffect(() => {
    if (!dmSocket) return;

    dmSocket.emit('dm:join', { conversationId });

    const onMessage = (msg: DmMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      // Mark the freshly-received message as read so the inbox badge
      // clears on the sender side too.
      if (msg.sender._id !== user?._id) {
        dmSocket.emit('message:read', {
          conversationId,
          messageId: msg._id,
        });
      }
    };

    const onSent = ({
      optimisticId,
      message,
    }: {
      optimisticId: string;
      message: DmMessage;
    }) => {
      const timer = sendTimeouts.current.get(optimisticId);
      if (timer) {
        clearTimeout(timer);
        sendTimeouts.current.delete(optimisticId);
      }
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.optimisticId === optimisticId);
        if (idx < 0) {
          return prev.some((m) => m._id === message._id)
            ? prev
            : [...prev, message];
        }
        const next = prev.slice();
        next[idx] = message;
        return next;
      });
      // Inbox preview / unread depends on the new lastMessage; refresh it.
      void queryClient.invalidateQueries({ queryKey: ['dm', 'conversations'] });
    };

    const onSendError = ({
      optimisticId,
      error,
    }: {
      optimisticId: string;
      error: string;
    }) => {
      const timer = sendTimeouts.current.get(optimisticId);
      if (timer) {
        clearTimeout(timer);
        sendTimeouts.current.delete(optimisticId);
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.optimisticId === optimisticId
            ? { ...m, sending: false, sendFailed: true }
            : m,
        ),
      );
      Alert.alert('Send failed', error);
    };

    const onUpdated = (msg: DmMessage) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      setActiveMessage((cur) =>
        cur && cur._id === msg._id ? toMessageShape(msg, conversationId) : cur,
      );
    };

    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === user?._id) return;
      setTypingActive(data.isTyping);
    };

    const onGenericError = (e: { message?: string }) => {
      Alert.alert('Chat error', e?.message ?? 'Something went wrong.');
    };

    dmSocket.on('message:new', onMessage);
    dmSocket.on('message:sent', onSent);
    dmSocket.on('message:error', onSendError);
    dmSocket.on('message:updated', onUpdated);
    dmSocket.on('typing:update', onTyping);
    dmSocket.on('error', onGenericError);

    return () => {
      dmSocket.off('message:new', onMessage);
      dmSocket.off('message:sent', onSent);
      dmSocket.off('message:error', onSendError);
      dmSocket.off('message:updated', onUpdated);
      dmSocket.off('typing:update', onTyping);
      dmSocket.off('error', onGenericError);
      dmSocket.emit('dm:leave', { conversationId });
    };
  }, [dmSocket, conversationId, user?._id, queryClient]);

  const buildOptimisticMessage = useCallback(
    (
      optimisticId: string,
      payload: PendingDmSendPayload,
      replyToMsg: Message | null,
    ): DmMessage => {
      const replyPreview = replyToMsg
        ? {
            _id: replyToMsg._id,
            sender: {
              _id: replyToMsg.sender._id,
              name: replyToMsg.sender.name,
              avatar: replyToMsg.sender.avatar,
            },
            content: replyToMsg.content,
            type: replyToMsg.type,
            mediaUrl: replyToMsg.mediaUrl ?? null,
            deletedAt: replyToMsg.deletedAt ?? null,
            createdAt: replyToMsg.createdAt,
          }
        : null;
      return {
        _id: optimisticId,
        optimisticId,
        sending: true,
        conversation: conversationId,
        sender: user!,
        content: payload.content,
        type: payload.type,
        mediaUrl: payload.mediaUrl ?? null,
        mediaThumb: payload.mediaThumb ?? null,
        readBy: [user!._id],
        reactions: [],
        replyTo: replyPreview,
        createdAt: new Date().toISOString(),
        pendingPayload: payload,
      };
    },
    [conversationId, user],
  );

  const dispatchSend = useCallback(
    (optimisticId: string, payload: PendingDmSendPayload) => {
      if (!dmSocket) return;
      dmSocket.emit('message:send', {
        conversationId,
        optimisticId,
        type: payload.type,
        content: payload.content,
        mediaUrl: payload.mediaUrl ?? null,
        mediaThumb: payload.mediaThumb ?? null,
        replyTo: payload.replyTo ?? null,
      });

      const timer = setTimeout(() => {
        sendTimeouts.current.delete(optimisticId);
        setMessages((prev) =>
          prev.map((m) =>
            m.optimisticId === optimisticId && m.sending
              ? { ...m, sending: false, sendFailed: true }
              : m,
          ),
        );
      }, SEND_TIMEOUT_MS);
      sendTimeouts.current.set(optimisticId, timer);
    },
    [dmSocket, conversationId],
  );

  const handleSend = useCallback(
    ({ content, media, replyTo }: SendPayload) => {
      if (!dmSocket || !user) return;

      const payload: PendingDmSendPayload = media
        ? {
            type: media.type,
            content,
            mediaUrl: media.dataUrl,
            mediaThumb: media.type === 'video' ? media.thumbDataUrl : null,
            replyTo: replyTo ?? null,
          }
        : {
            type: 'text',
            content,
            replyTo: replyTo ?? null,
          };

      const optimisticId = newOptimisticId();
      const localMsg = buildOptimisticMessage(optimisticId, payload, replyingTo);
      setMessages((prev) => [...prev, localMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      dispatchSend(optimisticId, payload);
    },
    [dmSocket, user, replyingTo, buildOptimisticMessage, dispatchSend],
  );

  const handleRetrySend = useCallback(
    (msg: DmMessage) => {
      if (!msg.pendingPayload) return;
      const optimisticId = msg.optimisticId ?? newOptimisticId();
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id
            ? { ...m, optimisticId, sending: true, sendFailed: false }
            : m,
        ),
      );
      dispatchSend(optimisticId, msg.pendingPayload);
    },
    [dispatchSend],
  );

  const handleDiscardLocal = useCallback((msg: DmMessage) => {
    if (!msg.optimisticId) return;
    const id = msg.optimisticId;
    const timer = sendTimeouts.current.get(id);
    if (timer) {
      clearTimeout(timer);
      sendTimeouts.current.delete(id);
    }
    setMessages((prev) => prev.filter((m) => m.optimisticId !== id));
  }, []);

  const handleEdit = useCallback(
    ({ messageId, content }: EditPayload) => {
      dmSocket?.emit('message:edit', { conversationId, messageId, content });
    },
    [dmSocket, conversationId],
  );

  const handleReact = useCallback(
    (msg: Message, emoji: string) => {
      if (msg.optimisticId) return;
      dmSocket?.emit('message:react', {
        conversationId,
        messageId: msg._id,
        emoji,
      });
    },
    [dmSocket, conversationId],
  );

  const handleTypingStart = useCallback(() => {
    dmSocket?.emit('typing:start', { conversationId });
  }, [dmSocket, conversationId]);

  const handleTypingStop = useCallback(() => {
    dmSocket?.emit('typing:stop', { conversationId });
  }, [dmSocket, conversationId]);

  const loadOlder = useCallback(async (): Promise<DmMessage[]> => {
    if (loadingOlder || !hasMoreHistory) return [];
    const oldest = messages.find((m) => !m.optimisticId);
    if (!oldest) return [];
    setLoadingOlder(true);
    try {
      const page = await dmApi.getMessages(
        conversationId,
        PAGE_SIZE,
        oldest.createdAt,
      );
      if (page.length === 0) {
        setHasMoreHistory(false);
        return [];
      }
      const ordered = [...page].reverse();
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m._id));
        const fresh = ordered.filter((m) => !existing.has(m._id));
        return [...fresh, ...prev];
      });
      if (page.length < PAGE_SIZE) setHasMoreHistory(false);
      return ordered;
    } catch (err) {
      Alert.alert(
        'Could not load older messages',
        err instanceof Error ? err.message : 'Try again in a moment.',
      );
      return [];
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMoreHistory, messages, conversationId]);

  const closeSheet = () => setActiveMessage(null);

  const handleSheetReact = (emoji: string) => {
    if (!activeMessage) return;
    handleReact(activeMessage, emoji);
    closeSheet();
  };

  const handleSheetReply = () => {
    if (!activeMessage) return;
    setReplyingTo(activeMessage);
    setEditingMessage(null);
    closeSheet();
  };

  const handleSheetCopy = async () => {
    if (!activeMessage || !activeMessage.content) {
      closeSheet();
      return;
    }
    await Clipboard.setStringAsync(activeMessage.content);
    closeSheet();
  };

  const handleSheetEdit = () => {
    if (!activeMessage) return;
    setEditingMessage(activeMessage);
    setReplyingTo(null);
    closeSheet();
  };

  const handleSheetDelete = () => {
    if (!activeMessage) return;
    const target = activeMessage;
    Alert.alert(
      'Delete message',
      'This message will be removed for both of you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dmSocket?.emit('message:delete', {
              conversationId,
              messageId: target._id,
            });
          },
        },
      ],
    );
    closeSheet();
  };

  const adapted = useMemo(
    () => messages.map((m) => toMessageShape(m, conversationId)),
    [messages, conversationId],
  );

  if (isLoading) {
    return (
      <ActivityIndicator
        className="flex-1 bg-bg-light dark:bg-bg-dark"
        color="#6366f1"
        size="large"
      />
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={adapted}
        keyExtractor={(m) => m._id}
        contentContainerClassName="p-4 pb-2"
        renderItem={({ item }) => {
          // Look up the underlying DmMessage so retry/discard handlers can
          // access fields the adapted Message strips (pendingPayload).
          const dm = messages.find((m) => m._id === item._id);
          if (!dm) return null;
          return (
            <MessageBubble
              message={item}
              isOwn={item.sender._id === user?._id}
              myUserId={user?._id}
              onLongPress={
                item.optimisticId ? undefined : (m) => setActiveMessage(m)
              }
              onReactionPress={(m, emoji) => handleReact(m, emoji)}
              onRetry={() => handleRetrySend(dm)}
              onDiscard={() => handleDiscardLocal(dm)}
            />
          );
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          }, 80);
        }}
        refreshControl={
          <RefreshControl
            refreshing={loadingOlder}
            onRefresh={hasMoreHistory ? loadOlder : undefined}
            enabled={hasMoreHistory}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        ListHeaderComponent={
          !hasMoreHistory && messages.length > 0 ? (
            <Text className="text-center text-slate-400 dark:text-slate-500 text-[11px] py-2">
              Beginning of conversation
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-16 text-[15px]">
            Say hello!
          </Text>
        }
      />
      {typingActive && (
        <View className="px-4 py-1">
          <Text className="text-slate-500 dark:text-slate-400 text-xs italic">
            Typing...
          </Text>
        </View>
      )}
      <MessageInput
        onSend={handleSend}
        onEdit={handleEdit}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      <MessageActionSheet
        visible={!!activeMessage}
        onClose={closeSheet}
        message={activeMessage}
        isOwn={activeMessage?.sender._id === user?._id}
        // No admin role in DMs — pin/admin-delete UI is hidden by passing false.
        isAdmin={false}
        myUserId={user?._id}
        onReact={handleSheetReact}
        onReply={handleSheetReply}
        onCopy={handleSheetCopy}
        onEdit={handleSheetEdit}
        // DMs don't support pin/forward — the sheet hides them via these flags
        // and the noop handlers below would never fire.
        onPin={() => {}}
        onUnpin={() => {}}
        onForward={() => {}}
        onDelete={handleSheetDelete}
        hideForward
      />
    </KeyboardAvoidingView>
  );
}
