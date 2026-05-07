import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import type { DmConversation } from '../../types/dm.types';

interface Props {
  conversation: DmConversation;
  myUserId: string;
  unread: number;
  onPress: () => void;
}

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const dayMs = 24 * 60 * 60 * 1000;
  if (now.getTime() - d.getTime() < 7 * dayMs) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function previewFor(conv: DmConversation, myUserId: string): string {
  const last = conv.lastMessage;
  if (!last) return 'Say hello';
  if (last.deletedAt) return 'Message deleted';
  const isOwn = last.sender._id === myUserId;
  const prefix = isOwn ? 'You: ' : '';
  if (last.type === 'image') {
    return `${prefix}${last.content || '📷 Photo'}`;
  }
  if (last.type === 'video') {
    return `${prefix}${last.content || '🎬 Video'}`;
  }
  return `${prefix}${last.content}`;
}

export function DmConversationRow({
  conversation,
  myUserId,
  unread,
  onPress,
}: Props) {
  const peer =
    conversation.participants.find((p) => p._id !== myUserId) ??
    conversation.participants[0];
  if (!peer) return null;

  const time = formatTime(conversation.lastMessageAt);
  const preview = previewFor(conversation, myUserId);
  const hasUnread = unread > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center px-5 py-3 bg-bg-light dark:bg-bg-dark"
    >
      <Avatar name={peer.name} uri={peer.avatar} size={48} />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text
            numberOfLines={1}
            className={`text-[15px] flex-1 mr-2 ${
              hasUnread
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-900 dark:text-white font-semibold'
            }`}
          >
            {peer.name}
          </Text>
          <Text
            className={`text-[11px] ${
              hasUnread
                ? 'text-primary font-semibold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {time}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[13px] ${
              hasUnread
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
