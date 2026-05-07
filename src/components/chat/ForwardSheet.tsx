import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { X, Check, Forward as ForwardIcon } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import type { Group } from '../../types/group.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  excludeGroupId?: string;
  onConfirm: (groupIds: string[]) => void;
}

export function ForwardSheet({
  visible,
  onClose,
  excludeGroupId,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups(),
    enabled: visible,
  });

  const visibleGroups = useMemo(
    () => (groups ?? []).filter((g) => g._id !== excludeGroupId),
    [groups, excludeGroupId],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={handleClose} />
        <View
          className="bg-surface-light dark:bg-surface-dark rounded-t-3xl"
          style={{ height: '80%' }}
        >
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          <View className="flex-row items-start justify-between px-5 pt-2 pb-3">
            <View>
              <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                Forward
              </Text>
              <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5">
                Send to trips
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={10} accessibilityLabel="Close">
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator className="my-12" color="#6366f1" />
          ) : visibleGroups.length === 0 ? (
            <Text className="text-slate-500 dark:text-slate-400 text-center text-[14px] my-12 px-6">
              No other trips to forward to. Join or create one first.
            </Text>
          ) : (
            <FlatList
              data={visibleGroups}
              keyExtractor={(g) => g._id}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              renderItem={({ item, index }) => (
                <GroupRow
                  group={item}
                  selected={selected.has(item._id)}
                  onToggle={() => toggle(item._id)}
                  isLast={index === visibleGroups.length - 1}
                />
              )}
            />
          )}

          <View className="flex-row gap-2 px-5 pt-3 pb-5">
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              className="flex-1 py-3.5 items-center rounded-xl bg-slate-100 dark:bg-slate-800"
            >
              <Text className="text-slate-700 dark:text-slate-200 text-[14px] font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={selected.size === 0}
              activeOpacity={0.8}
              className={`flex-1 py-3.5 items-center rounded-xl flex-row justify-center ${
                selected.size === 0 ? 'bg-primary/40' : 'bg-primary'
              }`}
            >
              <ForwardIcon size={16} color="#fff" />
              <Text className="text-white text-[14px] font-semibold ml-2">
                {selected.size === 0
                  ? 'Forward'
                  : `Forward (${selected.size})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GroupRow({
  group,
  selected,
  onToggle,
  isLast,
}: {
  group: Group;
  selected: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className={`flex-row items-center px-3 py-3 ${
        isLast ? '' : 'border-b border-border-light dark:border-border-dark'
      }`}
    >
      {group.coverImage ? (
        <Image
          source={{ uri: group.coverImage }}
          className="w-10 h-10 rounded-xl"
        />
      ) : (
        <View className="w-10 h-10 rounded-xl bg-primary/15 items-center justify-center">
          <Text className="text-primary font-bold text-base">
            {group.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-slate-900 dark:text-white text-[15px] font-semibold">
          {group.name}
        </Text>
        {group.destination && (
          <Text className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5" numberOfLines={1}>
            {group.destination}
          </Text>
        )}
      </View>
      <View
        className={`w-6 h-6 rounded-full items-center justify-center border ${
          selected
            ? 'bg-primary border-primary'
            : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {selected && <Check size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}
