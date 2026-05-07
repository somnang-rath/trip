import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  UtensilsCrossed,
  Car,
  Hotel,
  Sparkles,
  Package,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react-native';
import type { Expense } from '../../types/expense.types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Avatar } from '../ui/Avatar';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  accommodation: Hotel,
  activity: Sparkles,
  other: Package,
};

interface Props {
  expense: Expense;
  currentUserId: string;
  onSettle?: (expenseId: string) => void;
}

export function ExpenseItem({ expense, currentUserId, onSettle }: Props) {
  const myParticipant = expense.participants.find(
    (p) => p.user._id === currentUserId && p.user._id !== expense.paidBy._id,
  );
  const Icon = CATEGORY_ICON[expense.category] ?? Package;

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-2.5 border border-border-light dark:border-border-dark">
      <View className="flex-row items-center gap-2.5 mb-2.5">
        <View className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center">
          <Icon size={18} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-white text-[15px] font-semibold">{expense.title}</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{formatDate(expense.createdAt)}</Text>
        </View>
        <Text className="text-indigo-700 dark:text-indigo-300 text-base font-bold">
          {formatCurrency(expense.amount, expense.currency)}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Avatar name={expense.paidBy.name} uri={expense.paidBy.avatar} size={20} />
        <Text className="text-slate-500 dark:text-slate-400 text-[13px]">Paid by {expense.paidBy.name}</Text>
      </View>

      {myParticipant && (
        <View className="mt-2.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-700 dark:text-slate-300 text-[13px]">
              Your share: {formatCurrency(myParticipant.share, expense.currency)}
            </Text>
            {myParticipant.settled ? <CheckCircle2 size={14} color="#10b981" /> : null}
          </View>
          {!myParticipant.settled && onSettle && (
            <TouchableOpacity
              className="bg-emerald-100 dark:bg-emerald-950 rounded-lg px-3 py-1"
              onPress={() => onSettle(expense._id)}
            >
              <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Mark Settled</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
