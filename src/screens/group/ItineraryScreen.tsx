import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plus, MapPin, Clock } from 'lucide-react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParams } from '../../navigation/types';
import { useGroup, useAddItineraryItem } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDate, formatTime } from '../../utils/format';
import type { ItineraryItem } from '../../types/group.types';

type Route = RouteProp<RootStackParams, 'Itinerary'>;

export function ItineraryScreen() {
  const { params } = useRoute<Route>();
  const { data: group } = useGroup(params.groupId);
  const { mutate: addItem, isPending } = useAddItineraryItem(params.groupId);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', description: '' });

  function handleAdd() {
    if (!form.title.trim()) {
      Alert.alert('Title required');
      return;
    }
    addItem(
      { title: form.title.trim(), location: form.location.trim(), description: form.description.trim() },
      {
        onSuccess: () => {
          setShowModal(false);
          setForm({ title: '', location: '', description: '' });
        },
      },
    );
  }

  function renderItem({ item }: { item: ItineraryItem }) {
    return (
      <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-3 border border-border-light dark:border-border-dark">
        <Text className="text-slate-900 dark:text-white text-base font-semibold mb-1">{item.title}</Text>
        {item.location ? (
          <View className="flex-row items-center gap-1 mb-0.5">
            <MapPin size={13} color="#6366f1" />
            <Text className="text-indigo-700 dark:text-indigo-300 text-[13px]">{item.location}</Text>
          </View>
        ) : null}
        {item.datetime ? (
          <View className="flex-row items-center gap-1 mb-0.5">
            <Clock size={13} color="#6366f1" />
            <Text className="text-indigo-700 dark:text-indigo-300 text-[13px]">
              {formatDate(item.datetime)} {formatTime(item.datetime)}
            </Text>
          </View>
        ) : null}
        {item.description ? (
          <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-1.5">{item.description}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <FlatList
        data={group?.itinerary ?? []}
        keyExtractor={(i) => i._id}
        contentContainerClassName="p-4 pb-28"
        ListEmptyComponent={
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-16 text-base">
            No itinerary items yet
          </Text>
        }
        renderItem={renderItem}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-4 left-4 bg-primary rounded-xl py-3.5 items-center flex-row justify-center gap-1.5"
        onPress={() => setShowModal(true)}
      >
        <Plus size={18} color="#fff" />
        <Text className="text-white font-semibold text-[15px]">Add Item</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <Pressable
            className="absolute inset-0 bg-black/70"
            onPress={() => setShowModal(false)}
          />
          <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
            <View className="items-center py-2">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </View>
            <View className="px-6 pt-2 pb-6">
              <Text className="text-slate-900 dark:text-white text-lg font-bold mb-5">
                Add Itinerary Item
              </Text>
              <Input
                label="Title"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Museum visit"
              />
              <Input
                label="Location"
                value={form.location}
                onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
                placeholder="Louvre, Paris"
              />
              <Input
                label="Notes"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Optional notes"
                multiline
              />
              <Button title="Add" onPress={handleAdd} loading={isPending} />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowModal(false)}
                className="mt-2"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
