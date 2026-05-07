import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import type { RootStackParams } from '../../navigation/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../api/chat.api';
import { groupsApi } from '../../api/groups.api';
import { useSocketStore } from '../../store/socket.store';
import { useAuthStore } from '../../store/auth.store';
import { MessageBubble } from '../../components/chat/MessageBubble';
import {
  MessageInput,
  type SendPayload,
  type EditPayload,
} from '../../components/chat/MessageInput';
import { MessageActionSheet } from '../../components/chat/MessageActionSheet';
import { ForwardSheet } from '../../components/chat/ForwardSheet';
import { PinnedBanner } from '../../components/chat/PinnedBanner';
import type { Message, PendingSendPayload } from '../../types/chat.types';

type Route = RouteProp<RootStackParams, 'Chat'>;

// If we never hear back from the server within this window, assume the emit
// silently dropped (network blip, socket disconnect mid-flight) and flip the
// optimistic bubble to a failed state so the user can retry.
const SEND_TIMEOUT_MS = 30_000;
// Page size matches the REST default in `chatApi.getMessages`.
const PAGE_SIZE = 50;

function newOptimisticId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatScreen() {
  const { params } = useRoute<Route>();
  const { groupId } = params;
  const user = useAuthStore((s) => s.user);
  const chatSocket = useSocketStore((s) => s.chatSocket);
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);
  const historyLoaded = useRef(false);
  // Tracks pending-send timeouts by optimisticId so we can clear them on
  // success / failure and avoid leaking handles when the screen unmounts.
  const sendTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data: history, isLoading } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => chatApi.getMessages(groupId),
  });

  const { data: group } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => groupsApi.getGroup(groupId),
  });

  const { data: pinnedMessages = [] } = useQuery({
    queryKey: ['messages', groupId, 'pinned'],
    queryFn: () => chatApi.getPinned(groupId),
  });

  const myRole = useMemo(() => {
    if (!group || !user) return null;
    return group.members.find((m) => m.user._id === user._id)?.role ?? null;
  }, [group, user]);
  const isAdmin = myRole === 'admin' || myRole === 'owner';

  useEffect(() => {
    if (history && !historyLoaded.current) {
      historyLoaded.current = true;
      setMessages([...history].reverse());
      // If the first page wasn't full, there's nothing older to fetch — keep
      // the pull-to-refresh disabled and show the "beginning" footer.
      if (history.length < PAGE_SIZE) setHasMoreHistory(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [history]);

  // Snapshot of the timeout map so the unmount cleanup runs against the live
  // ref without re-binding on every render.
  useEffect(() => {
    const map = sendTimeouts.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  useEffect(() => {
    if (!chatSocket) return;

    chatSocket.emit('group:join', { groupId });

    const onMessage = (msg: Message) => {
      setMessages((prev) => {
        // Defensive dedupe: a stray broadcast sneaking back to the sender
        // before the `message:sent` swap would otherwise double-render.
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    };

    const onSent = ({
      optimisticId,
      message,
    }: {
      optimisticId: string;
      message: Message;
    }) => {
      const timer = sendTimeouts.current.get(optimisticId);
      if (timer) {
        clearTimeout(timer);
        sendTimeouts.current.delete(optimisticId);
      }
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.optimisticId === optimisticId);
        if (idx < 0) {
          // Edge case: optimistic bubble was discarded before the ack arrived.
          // Just append the server's message.
          return prev.some((m) => m._id === message._id) ? prev : [...prev, message];
        }
        const next = prev.slice();
        next[idx] = message;
        return next;
      });
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

    // Generic socket-level errors not tied to a specific send (auth issues,
    // edit/delete/pin/forward failures via WsExceptionFilter, etc.).
    const onGenericError = (e: { message?: string }) => {
      Alert.alert('Chat error', e?.message ?? 'Something went wrong.');
    };

    const onUpdated = (msg: Message) => {
      setMessages((prev) => {
        const wasPinned = prev.find((m) => m._id === msg._id)?.pinned ?? false;
        const next = prev.map((m) => (m._id === msg._id ? msg : m));
        if (wasPinned !== msg.pinned) {
          // Pinned-set membership actually changed — refresh the banner.
          // Reactions and edits don't move the pinned set so we skip the
          // refetch in that common case.
          void queryClient.invalidateQueries({
            queryKey: ['messages', groupId, 'pinned'],
          });
        }
        return next;
      });
      setActiveMessage((cur) => (cur && cur._id === msg._id ? msg : cur));
    };

    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === user?._id) return;
      setTypingUsers((prev) =>
        data.isTyping
          ? [...new Set([...prev, data.userId])]
          : prev.filter((id) => id !== data.userId),
      );
    };

    chatSocket.on('message:new', onMessage);
    chatSocket.on('message:sent', onSent);
    chatSocket.on('message:error', onSendError);
    chatSocket.on('message:updated', onUpdated);
    chatSocket.on('typing:update', onTyping);
    chatSocket.on('error', onGenericError);

    return () => {
      chatSocket.off('message:new', onMessage);
      chatSocket.off('message:sent', onSent);
      chatSocket.off('message:error', onSendError);
      chatSocket.off('message:updated', onUpdated);
      chatSocket.off('typing:update', onTyping);
      chatSocket.off('error', onGenericError);
      chatSocket.emit('group:leave', { groupId });
    };
  }, [chatSocket, groupId, user?._id, queryClient]);

  const buildOptimisticMessage = useCallback(
    (
      optimisticId: string,
      payload: PendingSendPayload,
      replyToMsg: Message | null,
    ): Message => {
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
        group: groupId,
        sender: user!,
        content: payload.content,
        type: payload.type,
        mediaUrl: payload.mediaUrl ?? null,
        mediaThumb: payload.mediaThumb ?? null,
        readBy: [user!._id],
        reactions: [],
        replyTo: replyPreview,
        pinned: false,
        createdAt: new Date().toISOString(),
        pendingPayload: payload,
      };
    },
    [groupId, user],
  );

  const dispatchSend = useCallback(
    (optimisticId: string, payload: PendingSendPayload) => {
      if (!chatSocket) return;
      chatSocket.emit('message:send', {
        groupId,
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
    [chatSocket, groupId],
  );

  const handleSend = useCallback(
    ({ content, media, replyTo }: SendPayload) => {
      if (!chatSocket || !user) return;

      const payload: PendingSendPayload = media
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
    [chatSocket, user, replyingTo, buildOptimisticMessage, dispatchSend],
  );

  const handleRetrySend = useCallback(
    (msg: Message) => {
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

  const handleDiscardLocal = useCallback((msg: Message) => {
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
      chatSocket?.emit('message:edit', { groupId, messageId, content });
    },
    [chatSocket, groupId],
  );

  const handleReact = useCallback(
    (msg: Message, emoji: string) => {
      // Optimistic local bubbles have no server id — reacting is a no-op.
      if (msg.optimisticId) return;
      chatSocket?.emit('message:react', {
        groupId,
        messageId: msg._id,
        emoji,
      });
    },
    [chatSocket, groupId],
  );

  const handleTypingStart = useCallback(() => {
    chatSocket?.emit('typing:start', { groupId });
  }, [chatSocket, groupId]);

  const handleTypingStop = useCallback(() => {
    chatSocket?.emit('typing:stop', { groupId });
  }, [chatSocket, groupId]);

  /**
   * Load one page of older history. Triggered by pull-to-refresh and
   * indirectly by `scrollToMessage` when the target falls outside the loaded
   * window. The cursor is the oldest *server-issued* message currently in
   * state (optimistic bubbles are skipped — they have no real `createdAt` we
   * can use against the server).
   */
  const loadOlder = useCallback(async (): Promise<Message[]> => {
    if (loadingOlder || !hasMoreHistory) return [];
    const oldest = messages.find((m) => !m.optimisticId);
    if (!oldest) return [];
    setLoadingOlder(true);
    try {
      const page = await chatApi.getMessages(groupId, PAGE_SIZE, oldest.createdAt);
      if (page.length === 0) {
        setHasMoreHistory(false);
        return [];
      }
      // The endpoint returns newest-first; reverse to chronological then prepend.
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
  }, [loadingOlder, hasMoreHistory, messages, groupId]);

  const scrollToMessage = useCallback(
    async (messageId: string) => {
      const idx = messages.findIndex((m) => m._id === messageId);
      if (idx >= 0) {
        listRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });
        setHighlightedId(messageId);
        setTimeout(() => setHighlightedId(null), 1500);
        return;
      }
      // Target is older than the loaded slice — try fetching one more page
      // and check again. We bail after one page to keep the wait short.
      const fresh = await loadOlder();
      const found = fresh.some((m) => m._id === messageId);
      if (!found) {
        Alert.alert(
          'Message not loaded',
          'This message is further back in history. Pull down at the top to load more.',
        );
        return;
      }
      // Defer the scroll so the prepend has a chance to lay out.
      setTimeout(() => {
        setMessages((current) => {
          const newIdx = current.findIndex((m) => m._id === messageId);
          if (newIdx >= 0) {
            listRef.current?.scrollToIndex({
              index: newIdx,
              animated: true,
              viewPosition: 0.5,
            });
            setHighlightedId(messageId);
            setTimeout(() => setHighlightedId(null), 1500);
          }
          return current;
        });
      }, 80);
    },
    [messages, loadOlder],
  );

  // === Action sheet handlers ===
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

  const handleSheetPin = () => {
    if (!activeMessage) return;
    chatSocket?.emit('message:pin', {
      groupId,
      messageId: activeMessage._id,
      pinned: true,
    });
    closeSheet();
  };

  const handleSheetUnpin = () => {
    if (!activeMessage) return;
    chatSocket?.emit('message:pin', {
      groupId,
      messageId: activeMessage._id,
      pinned: false,
    });
    closeSheet();
  };

  const handleSheetForward = () => {
    if (!activeMessage) return;
    setForwardingMessage(activeMessage);
    setForwardOpen(true);
    closeSheet();
  };

  const handleSheetDelete = () => {
    if (!activeMessage) return;
    const target = activeMessage;
    Alert.alert(
      'Delete message',
      'This message will be removed for everyone in the trip.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            chatSocket?.emit('message:delete', {
              groupId,
              messageId: target._id,
            });
          },
        },
      ],
    );
    closeSheet();
  };

  const handleForwardConfirm = (targetGroupIds: string[]) => {
    if (!forwardingMessage) return;
    chatSocket?.emit('message:forward', {
      messageId: forwardingMessage._id,
      targetGroupIds,
    });
    setForwardingMessage(null);
  };

  if (isLoading) {
    return <ActivityIndicator className="flex-1 bg-bg-light dark:bg-bg-dark" color="#6366f1" size="large" />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <PinnedBanner pinned={pinnedMessages} onJump={(m) => scrollToMessage(m._id)} />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m._id}
        contentContainerClassName="p-4 pb-2"
        renderItem={({ item }) => (
          <View
            className={
              highlightedId === item._id
                ? 'rounded-2xl bg-amber-100/40 dark:bg-amber-300/10 -mx-2 px-2'
                : ''
            }
          >
            <MessageBubble
              message={item}
              isOwn={item.sender._id === user?._id}
              myUserId={user?._id}
              // Long-press is disabled for in-flight / failed local bubbles —
              // they have no server id to act on.
              onLongPress={
                item.optimisticId ? undefined : (m) => setActiveMessage(m)
              }
              onReactionPress={(m, emoji) => handleReact(m, emoji)}
              onReplyQuotePress={(id) => scrollToMessage(id)}
              onRetry={() => handleRetrySend(item)}
              onDiscard={() => handleDiscardLocal(item)}
            />
          </View>
        )}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          }, 80);
        }}
        // Pull-to-refresh at the top loads one more page of older messages.
        // The list keeps its scroll position because RN measures the new
        // content above the visible window during the prepend.
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
            No messages yet. Say hello!
          </Text>
        }
      />
      {typingUsers.length > 0 && (
        <View className="px-4 py-1">
          <Text className="text-slate-500 dark:text-slate-400 text-xs italic">
            Someone is typing...
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
        isAdmin={isAdmin}
        myUserId={user?._id}
        onReact={handleSheetReact}
        onReply={handleSheetReply}
        onCopy={handleSheetCopy}
        onEdit={handleSheetEdit}
        onPin={handleSheetPin}
        onUnpin={handleSheetUnpin}
        onForward={handleSheetForward}
        onDelete={handleSheetDelete}
      />

      <ForwardSheet
        visible={forwardOpen}
        excludeGroupId={groupId}
        onClose={() => {
          setForwardOpen(false);
          setForwardingMessage(null);
        }}
        onConfirm={handleForwardConfirm}
      />
    </KeyboardAvoidingView>
  );
}
