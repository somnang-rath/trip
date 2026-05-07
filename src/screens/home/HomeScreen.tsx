import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  UserPlus,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Compass,
  Plane,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '../../navigation/types';
import { useMyGroups } from '../../hooks/useGroups';
import { useAuthStore } from '../../store/auth.store';
import type { Group, GroupMember } from '../../types/group.types';
import { Avatar } from '../../components/ui/Avatar';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const s = new Date(start);
  const sFmt = s.toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (!end) return sFmt;
  const e = new Date(end);
  const eFmt = e.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${sFmt} – ${eFmt}`;
}

function MemberStack({ members }: { members: GroupMember[] }) {
  const visible = members.slice(0, 3);
  const overflow = Math.max(0, members.length - visible.length);
  return (
    <View className="flex-row items-center">
      {visible.map((m, i) => (
        <View
          key={m.user._id}
          style={{ marginLeft: i === 0 ? 0 : -10 }}
          className="border-2 border-surface-light dark:border-surface-dark rounded-full"
        >
          <Avatar name={m.user.name} uri={m.user.avatar} size={26} />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={{ marginLeft: -10 }}
          className="w-[26px] h-[26px] rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-surface-light dark:border-surface-dark items-center justify-center"
        >
          <Text className="text-slate-700 dark:text-slate-200 text-[10px] font-bold">
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

function TripCard({ group, onPress }: { group: Group; onPress: () => void }) {
  const dateRange = formatDateRange(group.startDate, group.endDate);
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(99,102,241,0.12)' }}
      className="bg-surface-light dark:bg-surface-dark rounded-3xl mb-3 border border-border-light dark:border-border-dark overflow-hidden flex-row active:opacity-90"
    >
      <View className="w-1.5 bg-primary" />
      <View className="flex-1 p-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="flex-1 text-slate-900 dark:text-white text-lg font-bold pr-2">
            {group.name}
          </Text>
          <View className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 p-1.5">
            <ChevronRight size={16} color="#6366f1" />
          </View>
        </View>

        {(group.destination || dateRange) && (
          <View className="gap-1 mb-3">
            {group.destination ? (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={13} color="#6366f1" />
                <Text className="text-slate-600 dark:text-slate-300 text-[13px]">
                  {group.destination}
                </Text>
              </View>
            ) : null}
            {dateRange ? (
              <View className="flex-row items-center gap-1.5">
                <Calendar size={13} color="#6366f1" />
                <Text className="text-slate-600 dark:text-slate-300 text-[13px]">
                  {dateRange}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-border-light dark:border-border-dark">
          <MemberStack members={group.members} />
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider">
              Code
            </Text>
            <Text className="text-primary text-xs font-bold tracking-widest">
              {group.inviteCode}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: typeof Plane;
}) {
  return (
    <View className="flex-1 bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border border-border-light dark:border-border-dark">
      <View className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mb-3">
        <Icon size={16} color="#6366f1" />
      </View>
      <Text className="text-slate-900 dark:text-white text-2xl font-extrabold">{value}</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <View className="items-center mt-12 px-6">
      <View className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mb-5">
        <Compass size={36} color="#6366f1" />
      </View>
      <Text className="text-slate-900 dark:text-white text-xl font-bold mb-1.5">
        No trips yet
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6 leading-5">
        Start your first adventure or join a trip{'\n'}with an invite code from a friend.
      </Text>
      <View className="flex-row gap-3 w-full">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5"
          onPress={onCreate}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#fff" />
          <Text className="text-white font-semibold text-[14px]">Create Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5 border border-border-light dark:border-border-dark"
          onPress={onJoin}
          activeOpacity={0.85}
        >
          <UserPlus size={16} color="#6366f1" />
          <Text className="text-slate-800 dark:text-white font-semibold text-[14px]">
            Join Trip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<RootNavProp>();
  const user = useAuthStore((s) => s.user);
  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();

  const stats = useMemo(() => {
    const list = groups ?? [];
    const memberIds = new Set<string>();
    list.forEach((g) => g.members.forEach((m) => memberIds.add(m.user._id)));
    return { trips: list.length, members: memberIds.size };
  }, [groups]);

  const Header = (
    <View className="px-5 pt-2 pb-5">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1">
          <Text className="text-slate-500 dark:text-slate-400 text-[13px]">{greeting()},</Text>
          <Text className="text-slate-900 dark:text-white text-xl font-bold mt-0.5" numberOfLines={1}>
            {user?.name ?? 'Traveler'} 👋
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('App', { screen: 'Profile' } as any)}
          activeOpacity={0.7}
          className="rounded-full"
        >
          <Avatar name={user?.name ?? '?'} uri={user?.avatar} size={42} />
        </TouchableOpacity>
      </View>

      <View className="bg-primary rounded-3xl p-5 mb-5 overflow-hidden">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-white/80 text-[13px] mb-1">Where to next?</Text>
            <Text className="text-white text-2xl font-extrabold leading-7">
              Plan your next{'\n'}adventure
            </Text>
          </View>
          <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center">
            <Plane size={28} color="#ffffff" />
          </View>
        </View>
      </View>

      {(groups?.length ?? 0) > 0 && (
        <View className="flex-row gap-3 mb-2">
          <StatCard label="Active trips" value={stats.trips} Icon={Plane} />
          <StatCard label="Travelers" value={stats.members} Icon={Users} />
        </View>
      )}

      {(groups?.length ?? 0) > 0 && (
        <View className="flex-row items-center justify-between mt-5 mb-2">
          <Text className="text-slate-900 dark:text-white text-base font-bold">Your trips</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs">
            {groups!.length} {groups!.length === 1 ? 'trip' : 'trips'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-light dark:bg-bg-dark">
      {isLoading ? (
        <View className="flex-1">
          {Header}
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <FlatList
          data={groups ?? []}
          keyExtractor={(g) => g._id}
          ListHeaderComponent={Header}
          contentContainerClassName="px-5 pb-32"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <EmptyState
              onCreate={() => navigation.navigate('CreateGroup')}
              onJoin={() => navigation.navigate('JoinGroup')}
            />
          }
          renderItem={({ item }) => (
            <TripCard
              group={item}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
            />
          )}
        />
      )}

      {(groups?.length ?? 0) > 0 && (
        <View className="absolute bottom-6 left-5 right-5 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5 shadow-lg"
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white font-semibold text-[14px]">New Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-surface-light dark:bg-surface-dark rounded-2xl py-3.5 items-center flex-row justify-center gap-1.5 border border-border-light dark:border-border-dark"
            onPress={() => navigation.navigate('JoinGroup')}
            activeOpacity={0.85}
          >
            <UserPlus size={16} color="#6366f1" />
            <Text className="text-slate-800 dark:text-white font-semibold text-[14px]">
              Join
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
