import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import {
  Reply,
  Copy,
  Pencil,
  Pin,
  PinOff,
  Forward,
  Trash2,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import type { Message } from '../../types/chat.types';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

interface Props {
  visible: boolean;
  onClose: () => void;
  message: Message | null;
  isOwn: boolean;
  isAdmin: boolean;
  myUserId?: string;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onForward: () => void;
  onDelete: () => void;
  /** Hide the Forward action — set by DM chat where forwarding doesn't apply. */
  hideForward?: boolean;
}

interface Action {
  key: string;
  label: string;
  Icon: typeof Reply;
  onPress: () => void;
  destructive?: boolean;
  hint?: string;
}

export function MessageActionSheet({
  visible,
  onClose,
  message,
  isOwn,
  isAdmin,
  myUserId,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onPin,
  onUnpin,
  onForward,
  onDelete,
  hideForward,
}: Props) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const iconColor = dark ? '#e2e8f0' : '#1e293b';

  const body = message
    ? buildBody({
        message,
        isOwn,
        isAdmin,
        myUserId,
        hideForward,
        onReply,
        onCopy,
        onEdit,
        onPin,
        onUnpin,
        onForward,
        onDelete,
      })
    : null;

  return (
    <Modal
      visible={visible && !!body}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          {body ? (
            <View className="pb-4">
              <View className="flex-row items-start justify-between px-5 pt-2">
                <View className="flex-1 pr-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    Message
                  </Text>
                  <Text
                    className="text-slate-900 dark:text-white text-[14px] mt-0.5"
                    numberOfLines={2}
                  >
                    {previewFor(body.message)}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {!body.isDeleted && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  {QUICK_REACTIONS.map((emoji) => {
                    const active = body.myReaction === emoji;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => onReact(emoji)}
                        activeOpacity={0.7}
                        className={`w-12 h-12 rounded-full items-center justify-center mr-2 ${
                          active
                            ? 'bg-primary/20 border border-primary'
                            : 'bg-bg-light dark:bg-bg-dark'
                        }`}
                        accessibilityLabel={`React with ${emoji}`}
                      >
                        <Text className="text-2xl">{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {body.actions.length === 0 ? (
                <View className="px-5 pt-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[13px] italic">
                    No actions available for this message.
                  </Text>
                </View>
              ) : (
                <View className="px-2">
                  {body.actions.map((a, i) => (
                    <TouchableOpacity
                      key={a.key}
                      onPress={a.onPress}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-4 py-3.5 ${
                        i === body.actions.length - 1
                          ? ''
                          : 'border-b border-border-light dark:border-border-dark'
                      }`}
                    >
                      <a.Icon size={18} color={a.destructive ? '#dc2626' : iconColor} />
                      <View className="ml-3 flex-1">
                        <Text
                          className={`text-[15px] ${
                            a.destructive
                              ? 'text-red-600'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {a.label}
                        </Text>
                        {a.hint && (
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {a.hint}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="py-3.5 items-center"
              >
                <Text className="text-primary text-[14px] font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

interface BodyParts {
  message: Message;
  isDeleted: boolean;
  actions: Action[];
  myReaction: string | null;
}

function buildBody(args: {
  message: Message;
  isOwn: boolean;
  isAdmin: boolean;
  myUserId?: string;
  hideForward?: boolean;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onForward: () => void;
  onDelete: () => void;
}): BodyParts {
  const {
    message,
    isOwn,
    isAdmin,
    myUserId,
    hideForward,
    onReply,
    onCopy,
    onEdit,
    onPin,
    onUnpin,
    onForward,
    onDelete,
  } = args;
  const isDeleted = !!message.deletedAt;
  const isText = message.type === 'text';
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  const editMsLeft = EDIT_WINDOW_MS - ageMs;
  const withinEditWindow = editMsLeft > 0;

  const actions: Action[] = [];
  if (!isDeleted) {
    actions.push({ key: 'reply', label: 'Reply', Icon: Reply, onPress: onReply });
    if (isText) {
      actions.push({ key: 'copy', label: 'Copy text', Icon: Copy, onPress: onCopy });
    }
    if (isOwn && isText && withinEditWindow) {
      actions.push({
        key: 'edit',
        label: 'Edit',
        Icon: Pencil,
        onPress: onEdit,
        hint: `Editable for ~${formatEditTimeLeft(editMsLeft)}`,
      });
    }
    if (isAdmin) {
      actions.push(
        message.pinned
          ? { key: 'unpin', label: 'Unpin', Icon: PinOff, onPress: onUnpin }
          : { key: 'pin', label: 'Pin', Icon: Pin, onPress: onPin },
      );
    }
    if (!hideForward) {
      actions.push({
        key: 'forward',
        label: 'Forward',
        Icon: Forward,
        onPress: onForward,
      });
    }
  }
  if ((isOwn || isAdmin) && !isDeleted) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      Icon: Trash2,
      onPress: onDelete,
      destructive: true,
    });
  }

  const myReaction = myUserId
    ? message.reactions.find((r) => r.user === myUserId)?.emoji ?? null
    : null;

  return { message, isDeleted, actions, myReaction };
}

function formatEditTimeLeft(ms: number): string {
  const seconds = Math.max(1, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function previewFor(message: Message): string {
  if (message.deletedAt) return 'This message was deleted';
  if (message.type === 'image') {
    return message.content ? `Photo · ${message.content}` : 'Photo';
  }
  if (message.type === 'video') {
    return message.content ? `Video · ${message.content}` : 'Video';
  }
  return message.content;
}
