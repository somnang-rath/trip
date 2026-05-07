import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '../../navigation/types';
import { useCreateGroup } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function CreateGroupScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { mutate: create, isPending } = useCreateGroup();
  const [form, setForm] = useState({ name: '', description: '', destination: '' });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate() {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter a trip name');
      return;
    }
    create(
      { name: form.name.trim(), description: form.description.trim(), destination: form.destination.trim() },
      {
        onSuccess: (group) => {
          navigation.replace('GroupDetail', { groupId: group._id });
        },
        onError: () => Alert.alert('Error', 'Could not create trip. Please try again.'),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="p-6">
        <Input
          label="Trip Name"
          value={form.name}
          onChangeText={(v) => set('name', v)}
          placeholder="Summer Road Trip 2025"
        />
        <Input
          label="Destination (optional)"
          value={form.destination}
          onChangeText={(v) => set('destination', v)}
          placeholder="Paris, France"
        />
        <Input
          label="Description (optional)"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          placeholder="Tell your group what this trip is about"
          multiline
          numberOfLines={3}
        />
        <Button title="Create Trip" onPress={handleCreate} loading={isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
