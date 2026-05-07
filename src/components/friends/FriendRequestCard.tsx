import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Avatar } from '../ui/Avatar';
import type { FriendUserRef } from '../../types/friend.types';

interface Props {
  user: FriendUserRef;
  /** "incoming" → Accept/Decline, "outgoing" → Cancel only. */
  variant: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  busy?: boolean;
}

export function FriendRequestCard({
  user,
  variant,
  onAccept,
  onDecline,
  onCancel,
  busy,
}: Props) {
  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-2 border border-border-light dark:border-border-dark">
      <View className="flex-row items-center mb-3">
        <Avatar name={user.name} uri={user.avatar} size={44} />
        <View className="flex-1 ml-3">
          <Text
            numberOfLines={1}
            className="text-slate-900 dark:text-white text-base font-semibold"
          >
            {user.name}
          </Text>
          {user.email ? (
            <Text
              numberOfLines={1}
              className="text-slate-500 dark:text-slate-400 text-[12px]"
            >
              {user.email}
            </Text>
          ) : null}
        </View>
      </View>

      {variant === 'incoming' ? (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onAccept}
            disabled={busy}
            activeOpacity={0.85}
            className="flex-1 bg-primary rounded-xl py-2.5 flex-row items-center justify-center gap-1"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={16} color="#fff" />
                <Text className="text-white text-sm font-semibold">Accept</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDecline}
            disabled={busy}
            activeOpacity={0.85}
            className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 flex-row items-center justify-center gap-1"
          >
            <X size={16} color="#64748b" />
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onCancel}
          disabled={busy}
          activeOpacity={0.85}
          className="self-start bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
        >
          {busy ? (
            <ActivityIndicator size="small" color="#94a3b8" />
          ) : (
            <X size={12} color="#64748b" />
          )}
          <Text className="text-slate-700 dark:text-slate-300 text-[12px] font-semibold">
            Cancel request
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
