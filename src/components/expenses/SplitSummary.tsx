import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import type { DebtSummary } from '../../types/expense.types';
import { formatCurrency } from '../../utils/format';

interface Props {
  debts: DebtSummary[];
  currentUserId: string;
}

export function SplitSummary({ debts, currentUserId }: Props) {
  const myDebts = debts.filter((d) => d.from === currentUserId);
  const owedToMe = debts.filter((d) => d.to === currentUserId);

  if (debts.length === 0) {
    return (
      <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4 border border-border-light dark:border-border-dark flex-row items-center justify-center gap-2">
        <CheckCircle2 size={18} color="#10b981" />
        <Text className="text-emerald-500 text-base font-semibold text-center">All settled up!</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4 border border-border-light dark:border-border-dark">
      {myDebts.map((d, i) => (
        <View key={`d-${i}`} className="flex-row justify-between py-1.5">
          <Text className="text-slate-600 dark:text-slate-400 text-sm">You owe</Text>
          <Text className="text-red-500 text-sm font-semibold">{formatCurrency(d.amount)}</Text>
        </View>
      ))}
      {owedToMe.map((d, i) => (
        <View key={`c-${i}`} className="flex-row justify-between py-1.5">
          <Text className="text-slate-600 dark:text-slate-400 text-sm">Owed to you</Text>
          <Text className="text-emerald-500 text-sm font-semibold">{formatCurrency(d.amount)}</Text>
        </View>
      ))}
    </View>
  );
}
