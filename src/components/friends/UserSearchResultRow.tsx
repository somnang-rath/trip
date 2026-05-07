import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UserPlus, Check, Clock, Inbox } from 'lucide-react-native';
import { Avatar } from '../ui/Avatar';
import type { UserSearchResult } from '../../types/friend.types';

interface Props {
  user: UserSearchResult;
  onAdd: () => void;
  onAccept?: () => void;
  busy?: boolean;
}

export function UserSearchResultRow({
  user,
  onAdd,
  onAccept,
  busy,
}: Props) {
  return (
    <View className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-2xl p-3 mb-2 border border-border-light dark:border-border-dark">
      <Avatar name={user.name} uri={user.avatar} size={40} />
      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className="text-slate-900 dark:text-white text-sm font-semibold"
        >
          {user.name}
        </Text>
        <Text
          numberOfLines={1}
          className="text-slate-500 dark:text-slate-400 text-[12px]"
        >
          {user.email}
        </Text>
      </View>
      <ActionButton
        user={user}
        onAdd={onAdd}
        onAccept={onAccept}
        busy={!!busy}
      />
    </View>
  );
}

function ActionButton({
  user,
  onAdd,
  onAccept,
  busy,
}: {
  user: UserSearchResult;
  onAdd: () => void;
  onAccept?: () => void;
  busy: boolean;
}) {
  if (user.status === 'friends') {
    return (
      <View className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-3 py-1.5">
        <Check size={12} color="#10b981" />
        <Text className="text-emerald-600 dark:text-emerald-400 text-[12px] font-semibold">
          Friends
        </Text>
      </View>
    );
  }
  if (user.status === 'pending_outgoing') {
    return (
      <View className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5">
        <Clock size={12} color="#94a3b8" />
        <Text className="text-slate-600 dark:text-slate-300 text-[12px] font-semibold">
          Pending
        </Text>
      </View>
    );
  }
  if (user.status === 'pending_incoming') {
    return (
      <TouchableOpacity
        onPress={onAccept}
        disabled={busy}
        activeOpacity={0.85}
        className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-1.5"
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Inbox size={12} color="#fff" />
        )}
        <Text className="text-white text-[12px] font-semibold">Accept</Text>
      </TouchableOpacity>
    );
  }
  if (user.status === 'blocked_by_me') {
    return (
      <View className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5">
        <Text className="text-slate-500 dark:text-slate-400 text-[12px] font-semibold">
          Blocked
        </Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onAdd}
      disabled={busy}
      activeOpacity={0.85}
      className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-1.5"
    >
      {busy ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <UserPlus size={12} color="#fff" />
      )}
      <Text className="text-white text-[12px] font-semibold">Add</Text>
    </TouchableOpacity>
  );
}
