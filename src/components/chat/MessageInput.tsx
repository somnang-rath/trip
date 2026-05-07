import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Send, Plus, X, Play, CornerUpLeft, Pencil, Check } from 'lucide-react-native';
import { AttachmentSheet } from './AttachmentSheet';
import {
  pickPhotoFromLibrary,
  pickVideoFromLibrary,
  captureChatPhoto,
  captureChatVideo,
  type PickedMedia,
} from '../../utils/pickChatMedia';
import type { Message } from '../../types/chat.types';

export interface SendPayload {
  content: string;
  media?: PickedMedia | null;
  replyTo?: string | null;
}

export interface EditPayload {
  messageId: string;
  content: string;
}

interface Props {
  onSend: (payload: SendPayload) => void;
  onEdit: (payload: EditPayload) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  /** Message currently being replied to. Null clears the banner. */
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  /** Message currently being edited. When set, the input enters edit mode. */
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

export function MessageInput({
  onSend,
  onEdit,
  onTypingStart,
  onTypingStop,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}: Props) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [pickingMedia, setPickingMedia] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const { colorScheme } = useColorScheme();

  const isEditing = !!editingMessage;

  // When entering edit mode, prefill with the existing content and focus.
  // Drop any staged media — edits are text-only on the backend anyway.
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      setMedia(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingMessage]);

  // When entering reply mode, focus the input so the user can type immediately.
  useEffect(() => {
    if (replyingTo) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [replyingTo]);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      // Don't fire typing indicators while editing — confusing UX.
      if (isEditing) return;

      if (value.length > 0 && !isTyping.current) {
        isTyping.current = true;
        onTypingStart();
      }

      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        if (isTyping.current) {
          isTyping.current = false;
          onTypingStop();
        }
      }, 1500);
    },
    [onTypingStart, onTypingStop, isEditing],
  );

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping.current) {
      isTyping.current = false;
      onTypingStop();
    }
  }, [onTypingStop]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (isEditing && editingMessage) {
      if (!trimmed) return;
      if (trimmed === editingMessage.content) {
        // No-op edits would still hit the server; just close edit mode.
        onCancelEdit?.();
        setText('');
        return;
      }
      onEdit({ messageId: editingMessage._id, content: trimmed });
      setText('');
      onCancelEdit?.();
      return;
    }

    if (!trimmed && !media) return;
    onSend({ content: trimmed, media, replyTo: replyingTo?._id ?? null });
    setText('');
    setMedia(null);
    onCancelReply?.();
    stopTyping();
  }, [
    text,
    media,
    isEditing,
    editingMessage,
    replyingTo,
    onSend,
    onEdit,
    onCancelEdit,
    onCancelReply,
    stopTyping,
  ]);

  const runPick = useCallback(
    async (picker: () => Promise<PickedMedia | null>) => {
      if (pickingMedia || isEditing) return;
      try {
        setPickingMedia(true);
        const picked = await picker();
        if (picked) setMedia(picked);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load media.';
        Alert.alert('Attach failed', msg);
      } finally {
        setPickingMedia(false);
      }
    },
    [pickingMedia, isEditing],
  );

  const canSubmit =
    isEditing
      ? text.trim().length > 0
      : (text.trim().length > 0 || !!media) && !pickingMedia;

  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#94a3b8';
  const plusColor = colorScheme === 'dark' ? '#cbd5e1' : '#475569';
  const submitIcon = isEditing ? Check : Send;
  const SubmitIcon = submitIcon;

  return (
    <>
      <View
        className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark"
        style={{ paddingBottom: Platform.OS === 'ios' ? 12 : 8 }}
      >
        {replyingTo && !isEditing && (
          <ContextBanner
            tone="reply"
            title={`Replying to ${replyingTo.sender.name}`}
            preview={previewFor(replyingTo)}
            onCancel={onCancelReply}
          />
        )}

        {isEditing && (
          <ContextBanner
            tone="edit"
            title="Editing message"
            preview={editingMessage?.content ?? ''}
            onCancel={onCancelEdit}
          />
        )}

        {media && !isEditing && (
          <MediaPreview media={media} onClear={() => setMedia(null)} />
        )}

        <View className="flex-row items-end px-3 pt-2 gap-2">
          {!isEditing && (
            <TouchableOpacity
              accessibilityLabel="Attach media"
              testID="attach-button"
              className="w-10 h-10 rounded-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark items-center justify-center mb-px"
              onPress={() => setSheetOpen(true)}
              disabled={pickingMedia}
              activeOpacity={0.7}
            >
              {pickingMedia ? (
                <ActivityIndicator size="small" color={plusColor} />
              ) : (
                <Plus size={20} color={plusColor} />
              )}
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            className="flex-1 bg-bg-light dark:bg-bg-dark rounded-3xl px-4 py-2.5 text-slate-900 dark:text-white text-base border border-border-light dark:border-border-dark"
            style={{ maxHeight: 120 }}
            value={text}
            onChangeText={handleChange}
            placeholder={
              isEditing
                ? 'Edit message…'
                : media
                  ? 'Add a caption…'
                  : replyingTo
                    ? 'Reply…'
                    : 'Message...'
            }
            placeholderTextColor={placeholderColor}
            multiline
            maxLength={2000}
            returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
            onSubmitEditing={Platform.OS === 'android' ? handleSubmit : undefined}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            testID="send-button"
            accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
            className={`w-10 h-10 rounded-full items-center justify-center mb-px ${
              canSubmit ? 'bg-primary' : 'bg-slate-300 dark:bg-border-dark'
            }`}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.7}
          >
            <SubmitIcon size={18} color={canSubmit ? '#fff' : colorScheme === 'dark' ? '#6b7280' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </View>

      <AttachmentSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPickPhoto={() => runPick(pickPhotoFromLibrary)}
        onPickVideo={() => runPick(pickVideoFromLibrary)}
        onCapturePhoto={() => runPick(captureChatPhoto)}
        onCaptureVideo={() => runPick(captureChatVideo)}
      />
    </>
  );
}

function MediaPreview({
  media,
  onClear,
}: {
  media: PickedMedia;
  onClear: () => void;
}) {
  const thumbUri = media.type === 'image' ? media.dataUrl : media.thumbDataUrl;
  return (
    <View className="px-3 pt-3">
      <View className="flex-row items-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl p-2">
        <View className="relative">
          <Image
            source={{ uri: thumbUri }}
            className="w-14 h-14 rounded-xl"
            resizeMode="cover"
          />
          {media.type === 'video' && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-7 h-7 rounded-full bg-black/55 items-center justify-center">
                <Play size={14} color="#fff" fill="#fff" />
              </View>
            </View>
          )}
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-slate-900 dark:text-white text-[14px] font-semibold">
            {media.type === 'image' ? 'Photo ready to send' : 'Video ready to send'}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5">
            {media.type === 'image'
              ? `${media.width}×${media.height}`
              : `${Math.round((media.durationMs ?? 0) / 1000)}s · ${media.width}×${media.height}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClear}
          accessibilityLabel="Remove attachment"
          hitSlop={8}
          className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center"
        >
          <X size={14} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ContextBanner({
  tone,
  title,
  preview,
  onCancel,
}: {
  tone: 'reply' | 'edit';
  title: string;
  preview: string;
  onCancel?: () => void;
}) {
  const Icon = tone === 'reply' ? CornerUpLeft : Pencil;
  return (
    <View className="px-3 pt-2">
      <View className="flex-row items-stretch bg-bg-light dark:bg-bg-dark border-l-4 border-primary rounded-md overflow-hidden">
        <View className="flex-1 px-3 py-2">
          <View className="flex-row items-center">
            <Icon size={12} color="#6366f1" />
            <Text className="text-[11px] font-semibold text-primary ml-1">
              {title}
            </Text>
          </View>
          <Text
            className="text-[12px] mt-0.5 text-slate-600 dark:text-slate-400"
            numberOfLines={1}
          >
            {preview}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onCancel}
          accessibilityLabel="Cancel"
          hitSlop={8}
          className="px-3 items-center justify-center"
        >
          <X size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
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
