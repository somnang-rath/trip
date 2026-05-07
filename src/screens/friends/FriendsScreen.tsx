import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Users as UsersIcon,
  UserPlus,
  Inbox,
  ShieldOff,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '../../navigation/types';
import { useAuthStore } from '../../store/auth.store';
import {
  useFriendsList,
  useFriendRequests,
  useUserSearch,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
  useBlockUser,
  useUnblockUser,
  useBlockedUsers,
} from '../../hooks/useFriends';
import { useOpenDmConversation } from '../../hooks/useDm';
import { FriendListItem } from '../../components/friends/FriendListItem';
import { FriendRequestCard } from '../../components/friends/FriendRequestCard';
import { UserSearchResultRow } from '../../components/friends/UserSearchResultRow';
import type {
  Friendship,
  FriendUserRef,
} from '../../types/friend.types';

type Tab = 'friends' | 'requests' | 'add';

const TABS: { key: Tab; label: string }[] = [
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'add', label: 'Add' },
];

export function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-bg-light dark:bg-bg-dark"
    >
      <View className="px-5 pt-2 pb-3">
        <Text className="text-slate-900 dark:text-white text-2xl font-extrabold">
          Friends
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Find people, accept requests, and message friends.
        </Text>
      </View>

      <View className="px-5">
        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                activeOpacity={0.85}
                className={`flex-1 py-2 rounded-lg ${
                  active ? 'bg-surface-light dark:bg-slate-700' : ''
                }`}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    active
                      ? 'text-primary'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="flex-1 mt-3">
        {tab === 'friends' ? <FriendsTab /> : null}
        {tab === 'requests' ? <RequestsTab /> : null}
        {tab === 'add' ? <AddTab /> : null}
      </View>
    </SafeAreaView>
  );
}

// ── Friends list ─────────────────────────────────────────────────────────

function FriendsTab() {
  const navigation = useNavigation<RootNavProp>();
  const me = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useFriendsList();
  const blocked = useBlockedUsers();
  const unfriend = useUnfriend();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const openDm = useOpenDmConversation();
  const [showBlocked, setShowBlocked] = useState(false);

  function handleMessage(friend: FriendUserRef) {
    openDm.mutate(friend._id, {
      onSuccess: (conv) => {
        navigation.navigate('DmChat', {
          conversationId: conv._id,
          peerId: friend._id,
          peerName: friend.name,
        });
      },
      onError: (err) => alertError(err, 'Could not open chat'),
    });
  }

  if (isLoading) {
    return (
      <ActivityIndicator
        className="flex-1"
        color="#6366f1"
      />
    );
  }

  const friends = (data ?? [])
    .map((f) => peerOf(f, me?._id))
    .filter((u): u is FriendUserRef => !!u);
  const blockedList = (blocked.data ?? [])
    .map((f) => peerOf(f, me?._id))
    .filter((u): u is FriendUserRef => !!u);

  function showFriendActions(friend: FriendUserRef) {
    Alert.alert(friend.name, 'Choose an action', [
      {
        text: 'Unfriend',
        style: 'destructive',
        onPress: () =>
          unfriend.mutate(friend._id, {
            onError: (err) => alertError(err, 'Could not unfriend'),
          }),
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            `Block ${friend.name}?`,
            'They will no longer be able to send you messages or friend requests.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () =>
                  block.mutate(friend._id, {
                    onError: (err) => alertError(err, 'Could not block'),
                  }),
              },
            ],
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <FlatList
      data={showBlocked ? blockedList : friends}
      keyExtractor={(u) => u._id}
      contentContainerClassName="px-5 pb-10"
      onRefresh={() => {
        void refetch();
        void blocked.refetch();
      }}
      refreshing={isRefetching || blocked.isRefetching}
      ListHeaderComponent={
        <View className="flex-row mb-3">
          <TouchableOpacity
            onPress={() => setShowBlocked(false)}
            activeOpacity={0.85}
            className={`flex-row items-center gap-1.5 mr-3 ${showBlocked ? 'opacity-50' : ''}`}
          >
            <UsersIcon size={14} color="#6366f1" />
            <Text className="text-primary text-[12px] font-semibold">
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowBlocked(true)}
            activeOpacity={0.85}
            className={`flex-row items-center gap-1.5 ${!showBlocked ? 'opacity-50' : ''}`}
          >
            <ShieldOff size={14} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-[12px] font-semibold">
              Blocked ({blockedList.length})
            </Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <View className="items-center mt-20 px-8">
          <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
            {showBlocked ? (
              <ShieldOff size={28} color="#94a3b8" />
            ) : (
              <UsersIcon size={28} color="#94a3b8" />
            )}
          </View>
          <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
            {showBlocked ? 'No blocked users' : 'No friends yet'}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
            {showBlocked
              ? 'Anyone you block will appear here.'
              : 'Use the Add tab to find and invite people.'}
          </Text>
        </View>
      }
      renderItem={({ item }) =>
        showBlocked ? (
          <FriendListItem
            friend={item}
            onMore={() =>
              Alert.alert(item.name, 'Unblock this user?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Unblock',
                  onPress: () =>
                    unblock.mutate(item._id, {
                      onError: (err) => alertError(err, 'Could not unblock'),
                    }),
                },
              ])
            }
            busy={
              unblock.isPending &&
              (unblock.variables as string | undefined) === item._id
            }
          />
        ) : (
          <FriendListItem
            friend={item}
            onMessage={() => handleMessage(item)}
            onMore={() => showFriendActions(item)}
            busy={
              (unfriend.isPending &&
                (unfriend.variables as string | undefined) === item._id) ||
              (block.isPending &&
                (block.variables as string | undefined) === item._id) ||
              (openDm.isPending &&
                (openDm.variables as string | undefined) === item._id)
            }
          />
        )
      }
    />
  );
}

// ── Requests ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const incoming = useFriendRequests('incoming');
  const outgoing = useFriendRequests('outgoing');
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const cancel = useCancelFriendRequest();
  const me = useAuthStore((s) => s.user);

  const sections = useMemo(() => {
    const inc = (incoming.data ?? []).map((f) => ({
      ...f,
      _section: 'incoming' as const,
    }));
    const out = (outgoing.data ?? []).map((f) => ({
      ...f,
      _section: 'outgoing' as const,
    }));
    return [...inc, ...out];
  }, [incoming.data, outgoing.data]);

  if (incoming.isLoading || outgoing.isLoading) {
    return <ActivityIndicator className="flex-1" color="#6366f1" />;
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(f) => f._id}
      contentContainerClassName="px-5 pb-10"
      onRefresh={() => {
        void incoming.refetch();
        void outgoing.refetch();
      }}
      refreshing={incoming.isRefetching || outgoing.isRefetching}
      ListEmptyComponent={
        <View className="items-center mt-20 px-8">
          <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
            <Inbox size={28} color="#94a3b8" />
          </View>
          <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
            No requests right now
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
            Incoming and outgoing requests will appear here.
          </Text>
        </View>
      }
      ListHeaderComponent={
        sections.length > 0 ? (
          <View className="flex-row gap-4 mb-3">
            <Text className="text-slate-500 dark:text-slate-400 text-[12px] font-semibold uppercase tracking-wider">
              Incoming ({incoming.data?.length ?? 0})
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[12px] font-semibold uppercase tracking-wider">
              Outgoing ({outgoing.data?.length ?? 0})
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const peer = peerOf(item, me?._id);
        if (!peer) return null;
        if (item._section === 'incoming') {
          return (
            <FriendRequestCard
              user={peer}
              variant="incoming"
              onAccept={() =>
                accept.mutate(item._id, {
                  onError: (err) => alertError(err, 'Could not accept'),
                })
              }
              onDecline={() =>
                decline.mutate(item._id, {
                  onError: (err) => alertError(err, 'Could not decline'),
                })
              }
              busy={
                (accept.isPending &&
                  (accept.variables as string | undefined) === item._id) ||
                (decline.isPending &&
                  (decline.variables as string | undefined) === item._id)
              }
            />
          );
        }
        return (
          <FriendRequestCard
            user={peer}
            variant="outgoing"
            onCancel={() =>
              cancel.mutate(item._id, {
                onError: (err) => alertError(err, 'Could not cancel'),
              })
            }
            busy={
              cancel.isPending &&
              (cancel.variables as string | undefined) === item._id
            }
          />
        );
      }}
    />
  );
}

// ── Add (search) ─────────────────────────────────────────────────────────

function AddTab() {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();

  // 300ms debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), 300);
    return () => clearTimeout(id);
  }, [input]);

  const search = useUserSearch(debounced);

  return (
    <View className="flex-1">
      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-xl px-3 border border-border-light dark:border-border-dark">
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Search by name or email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 px-3 py-3 text-slate-900 dark:text-white text-sm"
          />
        </View>
        <Text className="text-slate-500 dark:text-slate-400 text-[11px] mt-1.5">
          Type at least 2 characters.
        </Text>
      </View>
      <FlatList
        data={search.data ?? []}
        keyExtractor={(u) => u._id}
        contentContainerClassName="px-5 pb-10"
        ListEmptyComponent={
          debounced.length < 2 ? (
            <View className="items-center mt-16 px-8">
              <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                <UserPlus size={28} color="#94a3b8" />
              </View>
              <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
                Find friends
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
                Search for someone by name or email to send a request.
              </Text>
            </View>
          ) : search.isFetching ? (
            <ActivityIndicator className="mt-12" color="#6366f1" />
          ) : (
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-12">
              No matches for &ldquo;{debounced}&rdquo;.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <UserSearchResultRow
            user={item}
            onAdd={() =>
              send.mutate(item._id, {
                onError: (err) => alertError(err, 'Could not send request'),
              })
            }
            onAccept={() => {
              // Search results don't carry the request id, so refetch the
              // incoming list and find the matching row to accept.
              // Simpler v1: prompt the user to switch to the Requests tab.
              Alert.alert(
                'Accept request',
                'Open the Requests tab to accept this request.',
              );
            }}
            busy={
              (send.isPending &&
                (send.variables as string | undefined) === item._id) ||
              (accept.isPending &&
                (accept.variables as string | undefined) === item._id)
            }
          />
        )}
      />
    </View>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function peerOf(
  friendship: Friendship,
  myId: string | undefined,
): FriendUserRef | null {
  if (!myId) return null;
  if (friendship.requester._id === myId) return friendship.recipient;
  if (friendship.recipient._id === myId) return friendship.requester;
  return null;
}

function alertError(err: unknown, fallback: string) {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  Alert.alert(
    fallback,
    e?.response?.data?.message ?? e?.message ?? 'Please try again.',
  );
}
