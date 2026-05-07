import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { Pin, ChevronDown, X, ChevronRight } from 'lucide-react-native';
import type { Message } from '../../types/chat.types';

interface Props {
  pinned: Message[];
  onJump: (message: Message) => void;
}

/**
 * Top-of-chat banner showing how many messages are pinned and the most recent
 * one as a single-line preview. Tap → jumps to it. The chevron opens a sheet
 * listing all pinned messages.
 *
 * Renders nothing when the pinned list is empty so the chat surface stays clean.
 */
export function PinnedBanner({ pinned, onJump }: Props) {
  const [listOpen, setListOpen] = useState(false);
  if (!pinned || pinned.length === 0) return null;

  const top = pinned[0];

  return (
    <>
      <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
        <TouchableOpacity
          onPress={() => onJump(top)}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center px-4 py-2.5"
        >
          <View className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center mr-2">
            <Pin size={13} color="#b45309" />
          </View>
          <View className="flex-1">
            <Text className="text-amber-700 dark:text-amber-300 text-[10px] uppercase tracking-wider font-semibold">
              {pinned.length === 1 ? 'Pinned message' : `${pinned.length} pinned messages`}
            </Text>
            <Text
              className="text-slate-900 dark:text-slate-100 text-[13px] mt-0.5"
              numberOfLines={1}
            >
              <Text className="font-semibold">{top.sender?.name ?? 'Someone'}: </Text>
              {previewFor(top)}
            </Text>
          </View>
        </TouchableOpacity>

        {pinned.length > 1 && (
          <TouchableOpacity
            onPress={() => setListOpen(true)}
            accessibilityLabel="Show all pinned messages"
            hitSlop={8}
            className="px-3 py-2.5"
          >
            <ChevronDown size={18} color="#b45309" />
          </TouchableOpacity>
        )}
      </View>

      <PinnedListSheet
        visible={listOpen}
        pinned={pinned}
        onClose={() => setListOpen(false)}
        onJump={(m) => {
          setListOpen(false);
          onJump(m);
        }}
      />
    </>
  );
}

function PinnedListSheet({
  visible,
  pinned,
  onClose,
  onJump,
}: {
  visible: boolean;
  pinned: Message[];
  onClose: () => void;
  onJump: (m: Message) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View
          className="bg-surface-light dark:bg-surface-dark rounded-t-3xl"
          style={{ height: '75%' }}
        >
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          <View className="flex-row items-start justify-between px-5 pt-2 pb-3">
            <View className="flex-row items-center">
              <Pin size={16} color="#b45309" />
              <Text className="text-slate-900 dark:text-white text-lg font-bold ml-2">
                Pinned messages
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={pinned}
            keyExtractor={(m) => m._id}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12 }}
            renderItem={({ item, index }) => (
              <PinnedRow
                message={item}
                onPress={() => onJump(item)}
                isLast={index === pinned.length - 1}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function PinnedRow({
  message,
  onPress,
  isLast,
}: {
  message: Message;
  onPress: () => void;
  isLast: boolean;
}) {
  const sender = message.sender;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-3 py-3 ${
        isLast ? '' : 'border-b border-border-light dark:border-border-dark'
      }`}
    >
      {sender?.avatar ? (
        <Image source={{ uri: sender.avatar }} className="w-9 h-9 rounded-full" />
      ) : (
        <View className="w-9 h-9 rounded-full bg-primary/15 items-center justify-center">
          <Text className="text-primary font-bold text-[14px]">
            {(sender?.name ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-slate-900 dark:text-white text-[14px] font-semibold">
          {sender?.name ?? 'Someone'}
        </Text>
        <Text
          className="text-slate-600 dark:text-slate-300 text-[13px] mt-0.5"
          numberOfLines={2}
        >
          {previewFor(message)}
        </Text>
      </View>
      <ChevronRight size={16} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function previewFor(message: Message): string {
  if (message.deletedAt) return 'Deleted message';
  if (message.type === 'image') {
    return message.content ? `📷 ${message.content}` : '📷 Photo';
  }
  if (message.type === 'video') {
    return message.content ? `🎬 ${message.content}` : '🎬 Video';
  }
  return message.content;
}
