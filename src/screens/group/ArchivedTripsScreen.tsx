import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Archive, Undo2, Calendar, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '../../navigation/types';
import { useMyArchivedGroups, useUnarchiveGroup } from '../../hooks/useGroups';
import type { Group } from '../../types/group.types';

function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const s = new Date(start).toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (!end) return s;
  const e = new Date(end).toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${s} – ${e}`;
}

function ArchivedCard({
  group,
  onOpen,
  onUnarchive,
  unarchiving,
}: {
  group: Group;
  onOpen: () => void;
  onUnarchive: () => void;
  unarchiving: boolean;
}) {
  const range = formatDateRange(group.startDate, group.endDate);
  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.85}
      className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-3 border border-border-light dark:border-border-dark"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-slate-900 dark:text-white text-base font-bold flex-1 pr-2">
          {group.name}
        </Text>
        <View className="bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-1">
          <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
            Archived
          </Text>
        </View>
      </View>
      {group.destination ? (
        <View className="flex-row items-center gap-1 mb-1">
          <MapPin size={12} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-[12px]">
            {group.destination}
          </Text>
        </View>
      ) : null}
      {range ? (
        <View className="flex-row items-center gap-1 mb-3">
          <Calendar size={12} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-[12px]">{range}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        onPress={onUnarchive}
        disabled={unarchiving}
        activeOpacity={0.85}
        className="self-start bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
      >
        {unarchiving ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : (
          <Undo2 size={12} color="#6366f1" />
        )}
        <Text className="text-primary text-[12px] font-semibold">Restore</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function ArchivedTripsScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { data: groups, isLoading, refetch, isRefetching } = useMyArchivedGroups();
  const unarchive = useUnarchiveGroup();

  function handleUnarchive(groupId: string, name: string) {
    Alert.alert(
      `Restore ${name}?`,
      'The trip will move back to your active trips and notifications resume.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () =>
            unarchive.mutate(groupId, {
              onError: (err: any) =>
                Alert.alert(
                  'Could not restore',
                  err?.response?.data?.message ?? 'Please try again.',
                ),
            }),
        },
      ],
    );
  }

  if (isLoading) {
    return <ActivityIndicator className="flex-1 bg-bg-light dark:bg-bg-dark" color="#6366f1" />;
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-bg-light dark:bg-bg-dark">
      <FlatList
        data={groups ?? []}
        keyExtractor={(g) => g._id}
        contentContainerClassName="p-5 pb-10"
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View className="items-center mt-20 px-8">
            <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
              <Archive size={28} color="#94a3b8" />
            </View>
            <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
              No archived trips
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
              Trips you archive will live here as a read-only record.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ArchivedCard
            group={item}
            onOpen={() => navigation.navigate('GroupDetail', { groupId: item._id })}
            onUnarchive={() => handleUnarchive(item._id, item.name)}
            unarchiving={
              unarchive.isPending && (unarchive.variables as string | undefined) === item._id
            }
          />
        )}
      />
    </SafeAreaView>
  );
}
