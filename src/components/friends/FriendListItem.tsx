import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, MessageCircle, MoreVertical } from 'lucide-react-native';
import { Avatar } from '../ui/Avatar';
import type { FriendUserRef } from '../../types/friend.types';

interface Props {
  friend: FriendUserRef;
  onMessage?: () => void;
  onMore?: () => void;
  busy?: boolean;
}

export function FriendListItem({ friend, onMessage, onMore, busy }: Props) {
  return (
    <View className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-2xl p-3 mb-2 border border-border-light dark:border-border-dark">
      <Avatar name={friend.name} uri={friend.avatar} size={44} />
      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className="text-slate-900 dark:text-white text-base font-semibold"
        >
          {friend.name}
        </Text>
        {friend.email ? (
          <Text
            numberOfLines={1}
            className="text-slate-500 dark:text-slate-400 text-[12px]"
          >
            {friend.email}
          </Text>
        ) : null}
      </View>
      {onMessage ? (
        <TouchableOpacity
          onPress={onMessage}
          activeOpacity={0.85}
          className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-1"
          accessibilityLabel={`Message ${friend.name}`}
        >
          <MessageCircle size={18} color="#6366f1" />
        </TouchableOpacity>
      ) : null}
      {onMore ? (
        <TouchableOpacity
          onPress={onMore}
          disabled={busy}
          activeOpacity={0.85}
          className="w-9 h-9 rounded-full items-center justify-center"
          accessibilityLabel={`More options for ${friend.name}`}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <MoreVertical size={18} color="#94a3b8" />
          )}
        </TouchableOpacity>
      ) : (
        <ChevronRight size={18} color="#cbd5e1" />
      )}
    </View>
  );
}
