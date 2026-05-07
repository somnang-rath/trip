import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Plus,
  X,
  UtensilsCrossed,
  Car,
  Hotel,
  Sparkles,
  Package,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RootStackParams } from '../../navigation/types';
import { expensesApi } from '../../api/expenses.api';
import { useAuthStore } from '../../store/auth.store';
import type { Expense, ExpenseCategory } from '../../types/expense.types';

type Route = RouteProp<RootStackParams, 'Expenses'>;

const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activity', 'other'];
const CATEGORY_ICON: Record<ExpenseCategory, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  accommodation: Hotel,
  activity: Sparkles,
  other: Package,
};

function formatAmount(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface AddExpenseForm {
  title: string;
  amount: string;
  currency: string;
  category: ExpenseCategory;
  notes: string;
}

const DEFAULT_FORM: AddExpenseForm = {
  title: '',
  amount: '',
  currency: 'USD',
  category: 'other',
  notes: '',
};

export function ExpensesScreen() {
  const { params } = useRoute<Route>();
  const { groupId } = params;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#94a3b8';

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AddExpenseForm>(DEFAULT_FORM);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => expensesApi.getExpenses(groupId),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary', groupId],
    queryFn: () => expensesApi.getSummary(groupId),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => expensesApi.createExpense(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', groupId] });
      setModalVisible(false);
      setForm(DEFAULT_FORM);
    },
    onError: () => Alert.alert('Error', 'Failed to add expense.'),
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => expensesApi.settleExpense(groupId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', groupId] });
    },
    onError: () => Alert.alert('Error', 'Failed to settle expense.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(groupId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', groupId] });
    },
    onError: () => Alert.alert('Error', 'Failed to delete expense.'),
  });

  const handleSubmit = useCallback(() => {
    const trimmedTitle = form.title.trim();
    const parsed = parseFloat(form.amount);
    if (!trimmedTitle) return Alert.alert('Validation', 'Title is required.');
    if (isNaN(parsed) || parsed <= 0) return Alert.alert('Validation', 'Enter a valid amount.');
    createMutation.mutate({
      title: trimmedTitle,
      amount: parsed,
      currency: form.currency.trim().toUpperCase() || 'USD',
      category: form.category,
      notes: form.notes.trim(),
    });
  }, [form, createMutation]);

  const confirmDelete = useCallback(
    (expense: Expense) => {
      Alert.alert('Delete Expense', `Delete "${expense.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(expense._id) },
      ]);
    },
    [deleteMutation],
  );

  const userDebts = summary?.debts.filter((d) => d.from === user?._id) ?? [];
  const userOwed = summary?.debts.filter((d) => d.to === user?._id) ?? [];

  const renderExpense = useCallback(
    ({ item }: { item: Expense }) => {
      const isOwner = item.createdBy._id === user?._id;
      const myParticipation = item.participants.find((p) => p.user._id === user?._id);
      const Icon = CATEGORY_ICON[item.category] ?? Package;
      return (
        <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-3.5 mb-2.5 border border-border-light dark:border-border-dark relative">
          <View className="flex-row items-start gap-2.5">
            <View className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center">
              <Icon size={18} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-[15px] font-semibold">
                {item.title}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Paid by {item.paidBy.name} · {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text className="text-slate-900 dark:text-white text-base font-bold">
              {formatAmount(item.amount, item.currency)}
            </Text>
          </View>
          {myParticipation && (
            <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-border-light dark:border-border-dark">
              <Text className="text-slate-500 dark:text-slate-400 text-[13px]">
                Your share: {formatAmount(myParticipation.share, item.currency)}
              </Text>
              {myParticipation.settled ? (
                <View className="flex-row items-center gap-1 bg-emerald-100 dark:bg-emerald-950 rounded-md px-2 py-0.5">
                  <CheckCircle2 size={12} color="#10b981" />
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    Settled
                  </Text>
                </View>
              ) : item.paidBy._id !== user?._id ? (
                <TouchableOpacity
                  className="bg-primary rounded-md px-3 py-1"
                  onPress={() => settleMutation.mutate(item._id)}
                >
                  <Text className="text-white text-xs font-semibold">Settle</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          {isOwner && (
            <TouchableOpacity
              className="absolute top-3 right-3"
              onPress={() => confirmDelete(item)}
              accessibilityLabel="Delete expense"
            >
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [user, settleMutation, confirmDelete],
  );

  if (isLoading) {
    return <ActivityIndicator className="flex-1 bg-bg-light dark:bg-bg-dark" color="#6366f1" size="large" />;
  }

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {(userDebts.length > 0 || userOwed.length > 0) && (
        <View className="mx-4 mt-4 bg-surface-light dark:bg-surface-dark rounded-xl p-3.5 border border-border-light dark:border-border-dark">
          <Text className="text-indigo-700 dark:text-indigo-300 text-[13px] font-semibold mb-1.5">
            Your Balance
          </Text>
          {userDebts.map((d, i) => (
            <Text key={`d-${i}`} className="text-red-500 text-[13px] mb-0.5">
              You owe {d.to} · {d.amount.toFixed(2)}
            </Text>
          ))}
          {userOwed.map((d, i) => (
            <Text key={`o-${i}`} className="text-emerald-500 text-[13px] mb-0.5">
              {d.from} owes you · {d.amount.toFixed(2)}
            </Text>
          ))}
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(e) => e._id}
        contentContainerClassName="p-4 pb-28"
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-16 text-[15px]">
            No expenses yet. Add one!
          </Text>
        }
      />

      <TouchableOpacity
        className="absolute right-5 bottom-7 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add expense"
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setForm(DEFAULT_FORM);
        }}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => {
              setModalVisible(false);
              setForm(DEFAULT_FORM);
            }}
          />
          <View
            className="bg-surface-light dark:bg-surface-dark rounded-t-3xl"
            style={{ height: '90%' }}
          >
            <View className="items-center py-2">
              <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </View>
            <View className="px-5">
              <View className="flex-row justify-between items-center mb-5 pt-2">
                <Text className="text-slate-900 dark:text-white text-lg font-bold">Add Expense</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setForm(DEFAULT_FORM);
                  }}
                  accessibilityLabel="Close"
                >
                  <X size={20} color={colorScheme === 'dark' ? '#9ca3af' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-medium mb-1.5 mt-3.5">
                Title *
              </Text>
              <TextInput
                className="bg-bg-light dark:bg-bg-dark rounded-lg px-3.5 py-3 text-slate-900 dark:text-white text-[15px] border border-border-light dark:border-border-dark"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="e.g. Dinner at restaurant"
                placeholderTextColor={placeholderColor}
                maxLength={100}
              />

              <View className="flex-row items-start mt-3.5">
                <View className="flex-1">
                  <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-medium mb-1.5">
                    Amount *
                  </Text>
                  <TextInput
                    className="bg-bg-light dark:bg-bg-dark rounded-lg px-3.5 py-3 text-slate-900 dark:text-white text-[15px] border border-border-light dark:border-border-dark"
                    value={form.amount}
                    onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                    placeholder="0.00"
                    placeholderTextColor={placeholderColor}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="w-2.5" />
                <View className="w-20">
                  <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-medium mb-1.5">
                    Currency
                  </Text>
                  <TextInput
                    className="bg-bg-light dark:bg-bg-dark rounded-lg px-3.5 py-3 text-slate-900 dark:text-white text-[15px] border border-border-light dark:border-border-dark"
                    value={form.currency}
                    onChangeText={(v) => setForm((f) => ({ ...f, currency: v.toUpperCase() }))}
                    placeholder="USD"
                    placeholderTextColor={placeholderColor}
                    maxLength={3}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-medium mb-1.5 mt-3.5">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICON[cat];
                  const active = form.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        active
                          ? 'bg-indigo-100 dark:bg-indigo-950 border-primary'
                          : 'bg-bg-light dark:bg-bg-dark border-border-light dark:border-border-dark'
                      }`}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                    >
                      <Icon size={12} color={active ? '#6366f1' : colorScheme === 'dark' ? '#d1d5db' : '#475569'} />
                      <Text
                        className={`text-xs ${
                          active ? 'text-primary' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-medium mb-1.5 mt-3.5">
                Notes
              </Text>
              <TextInput
                className="bg-bg-light dark:bg-bg-dark rounded-lg px-3.5 py-3 text-slate-900 dark:text-white text-[15px] border border-border-light dark:border-border-dark"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                placeholder="Optional notes..."
                placeholderTextColor={placeholderColor}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                className={`bg-primary rounded-xl p-4 items-center mt-6 mb-2 ${
                  createMutation.isPending ? 'opacity-60' : ''
                }`}
                onPress={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-base font-bold">Add Expense</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
