import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import {
  Play,
  Trash2,
  Pin,
  CornerUpLeft,
  Clock,
  AlertTriangle,
  RotateCw,
  X,
  Forward,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import type { Message, Reaction } from '../../types/chat.types';
import { MediaLightbox } from './MediaLightbox';

interface Props {
  message: Message;
  isOwn: boolean;
  myUserId?: string;
  onLongPress?: (message: Message) => void;
  onReactionPress?: (message: Message, emoji: string) => void;
  onReplyQuotePress?: (replyToId: string) => void;
  /** Re-emit a previously failed local message. */
  onRetry?: () => void;
  /** Drop a failed local message from the chat list. */
  onDiscard?: () => void;
}

const MEDIA_BUBBLE_WIDTH = 240;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ReactionGroup {
  emoji: string;
  count: number;
  mineSelected: boolean;
}

function groupReactions(reactions: Reaction[], myUserId?: string): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.user === myUserId) existing.mineSelected = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        mineSelected: r.user === myUserId,
      });
    }
  }
  return Array.from(map.values());
}

export function MessageBubble({
  message,
  isOwn,
  myUserId,
  onLongPress,
  onReactionPress,
  onReplyQuotePress,
  onRetry,
  onDiscard,
}: Props) {
  const {
    sender,
    content,
    type,
    createdAt,
    editedAt,
    deletedAt,
    mediaUrl,
    mediaThumb,
    replyTo,
    pinned,
    reactions,
    sending,
    sendFailed,
    forwardedFrom,
  } = message;
  const { colorScheme } = useColorScheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const reactionGroups = useMemo(
    () => groupReactions(reactions ?? [], myUserId),
    [reactions, myUserId],
  );

  if (type === 'system') {
    return (
      <View className="items-center my-2">
        <Text className="text-slate-500 dark:text-slate-400 text-xs italic">{content}</Text>
      </View>
    );
  }

  const isMedia = type === 'image' || type === 'video';
  const showCaption = !!content && !deletedAt;
  const tombstoneIconColor = colorScheme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <View className={`mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
      {pinned && !deletedAt && (
        <View
          className={`flex-row items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-1 ${
            isOwn ? 'mr-10' : 'ml-10'
          }`}
        >
          <Pin size={10} color="#b45309" />
          <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 ml-1">
            Pinned
          </Text>
        </View>
      )}

      <View
        className={`flex-row items-end max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        {!isOwn && (
          <View className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 items-center justify-center mr-2 shrink-0 overflow-hidden">
            {sender.avatar ? (
              <Image source={{ uri: sender.avatar }} className="w-8 h-8 rounded-full" />
            ) : (
              <Text className="text-white text-[13px] font-semibold">
                {sender.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}

        <Pressable
          onLongPress={() => onLongPress?.(message)}
          delayLongPress={250}
          className={`rounded-2xl max-w-full ${
            isOwn
              ? 'bg-primary rounded-br-sm'
              : 'bg-slate-100 dark:bg-[#1e1e3a] rounded-bl-sm'
          } ${isMedia && !deletedAt ? 'overflow-hidden p-1' : 'px-3 py-2'}`}
        >
          {!isOwn && !deletedAt && (
            <Text
              className={`text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold ${
                isMedia ? 'px-2 pt-1 mb-1' : 'mb-0.5'
              }`}
            >
              {sender.name}
            </Text>
          )}

          {forwardedFrom && !deletedAt && (
            <View
              className={`flex-row items-center ${
                isMedia ? 'px-2 pt-0.5' : 'mb-1'
              }`}
            >
              <Forward
                size={11}
                color={isOwn ? 'rgba(255,255,255,0.7)' : '#94a3b8'}
              />
              <Text
                className={`text-[11px] ml-1 italic ${
                  isOwn ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Forwarded
              </Text>
            </View>
          )}

          {!deletedAt && replyTo && (
            <ReplyQuote
              replyTo={replyTo}
              isOwn={isOwn}
              isMedia={isMedia}
              onPress={
                onReplyQuotePress ? () => onReplyQuotePress(replyTo._id) : undefined
              }
            />
          )}

          {deletedAt ? (
            <View className="flex-row items-center">
              <Trash2 size={13} color={tombstoneIconColor} />
              <Text
                className={`text-[14px] ml-1.5 italic ${
                  isOwn ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                This message was deleted
              </Text>
            </View>
          ) : (
            <>
              {type === 'image' && mediaUrl && (
                <TouchableOpacity
                  onPress={() => setLightboxOpen(true)}
                  onLongPress={() => onLongPress?.(message)}
                  delayLongPress={250}
                  activeOpacity={0.9}
                  accessibilityLabel="Open photo"
                >
                  <Image
                    source={{ uri: mediaUrl }}
                    style={{
                      width: MEDIA_BUBBLE_WIDTH,
                      height: MEDIA_BUBBLE_WIDTH,
                    }}
                    className="rounded-xl"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              {type === 'video' && (mediaUrl || mediaThumb) && (
                <TouchableOpacity
                  onPress={() => setLightboxOpen(true)}
                  onLongPress={() => onLongPress?.(message)}
                  delayLongPress={250}
                  activeOpacity={0.9}
                  accessibilityLabel="Play video"
                >
                  <View>
                    <Image
                      source={{ uri: mediaThumb ?? mediaUrl ?? undefined }}
                      style={{
                        width: MEDIA_BUBBLE_WIDTH,
                        height: MEDIA_BUBBLE_WIDTH * 0.75,
                      }}
                      className="rounded-xl bg-black"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-12 h-12 rounded-full bg-black/55 items-center justify-center">
                        <Play size={22} color="#fff" fill="#fff" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {showCaption && (
                <Text
                  className={`text-[15px] leading-5 ${
                    isMedia ? 'px-2 pt-1.5 pb-0.5' : ''
                  } ${isOwn ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}
                >
                  {content}
                </Text>
              )}
            </>
          )}

          <View
            className={`flex-row items-center self-end ${
              isMedia && !deletedAt ? 'px-2 pb-1 pt-0.5' : 'mt-1'
            }`}
          >
            {editedAt && !deletedAt && (
              <Text
                className={`text-[10px] mr-1.5 italic ${
                  isOwn ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                edited
              </Text>
            )}
            <Text
              className={`text-[10px] ${
                isOwn ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {formatTime(createdAt)}
            </Text>
            {sending && (
              <Clock
                size={10}
                color={isOwn ? 'rgba(255,255,255,0.65)' : '#94a3b8'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </Pressable>
      </View>

      {sendFailed && (
        <View
          className={`flex-row items-center mt-1 ${
            isOwn ? 'self-end' : 'ml-10 self-start'
          }`}
        >
          <AlertTriangle size={12} color="#dc2626" />
          <Text className="text-[11px] text-red-600 ml-1 mr-2 font-semibold">
            Couldn't send
          </Text>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              accessibilityLabel="Retry send"
              hitSlop={6}
              className="flex-row items-center px-2 py-0.5 rounded-full bg-primary/15"
            >
              <RotateCw size={11} color="#6366f1" />
              <Text className="text-[11px] text-primary ml-1 font-semibold">Retry</Text>
            </TouchableOpacity>
          )}
          {onDiscard && (
            <TouchableOpacity
              onPress={onDiscard}
              accessibilityLabel="Discard message"
              hitSlop={6}
              className="flex-row items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 ml-1.5"
            >
              <X size={11} color="#64748b" />
              <Text className="text-[11px] text-slate-600 dark:text-slate-300 ml-1 font-semibold">
                Discard
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {reactionGroups.length > 0 && !deletedAt && (
        <View
          className={`flex-row flex-wrap mt-1 ${
            isOwn ? 'justify-end mr-1' : 'ml-10'
          }`}
        >
          {reactionGroups.map((g) => (
            <TouchableOpacity
              key={g.emoji}
              onPress={() => onReactionPress?.(message, g.emoji)}
              activeOpacity={0.7}
              className={`flex-row items-center px-2 py-0.5 rounded-full mr-1 mb-1 border ${
                g.mineSelected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-slate-100 dark:bg-[#1e1e3a] border-transparent'
              }`}
            >
              <Text className="text-[13px]">{g.emoji}</Text>
              {g.count > 1 && (
                <Text className="text-[11px] ml-1 text-slate-700 dark:text-slate-200">
                  {g.count}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/*
        Mount the lightbox only while open so its native video player is
        released on close. Re-mounting on next open is cheap.
      */}
      {lightboxOpen && !deletedAt && type === 'image' && mediaUrl && (
        <MediaLightbox
          onClose={() => setLightboxOpen(false)}
          type="image"
          uri={mediaUrl}
        />
      )}
      {lightboxOpen && !deletedAt && type === 'video' && mediaUrl && (
        <MediaLightbox
          onClose={() => setLightboxOpen(false)}
          type="video"
          uri={mediaUrl}
        />
      )}
    </View>
  );
}

function ReplyQuote({
  replyTo,
  isOwn,
  isMedia,
  onPress,
}: {
  replyTo: NonNullable<Message['replyTo']>;
  isOwn: boolean;
  isMedia: boolean;
  onPress?: () => void;
}) {
  const labelColor = isOwn ? 'text-white/85' : 'text-slate-700 dark:text-slate-200';
  const subColor = isOwn ? 'text-white/60' : 'text-slate-500 dark:text-slate-400';
  const stripeColor = isOwn ? 'bg-white/40' : 'bg-primary';

  let preview: string;
  if (replyTo.deletedAt) preview = 'Deleted message';
  else if (replyTo.type === 'image')
    preview = replyTo.content ? `📷 ${replyTo.content}` : '📷 Photo';
  else if (replyTo.type === 'video')
    preview = replyTo.content ? `🎬 ${replyTo.content}` : '🎬 Video';
  else preview = replyTo.content;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
      className={`flex-row items-stretch rounded-md mb-1 overflow-hidden ${
        isMedia ? 'mx-1.5 mt-1' : ''
      } ${isOwn ? 'bg-white/10' : 'bg-black/5 dark:bg-white/5'}`}
    >
      <View className={`w-1 ${stripeColor}`} />
      <View className="flex-1 px-2 py-1">
        <View className="flex-row items-center">
          <CornerUpLeft size={10} color={isOwn ? '#fff' : '#6366f1'} />
          <Text className={`text-[11px] font-semibold ml-1 ${labelColor}`} numberOfLines={1}>
            {replyTo.sender?.name ?? 'Someone'}
          </Text>
        </View>
        <Text className={`text-[12px] mt-0.5 ${subColor}`} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Container>
  );
}
