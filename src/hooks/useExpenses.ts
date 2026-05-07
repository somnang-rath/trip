import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses.api';

export function useExpenses(groupId: string) {
  return useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => expensesApi.getExpenses(groupId),
    enabled: !!groupId,
  });
}

export function useExpenseSummary(groupId: string) {
  return useQuery({
    queryKey: ['expenses', groupId, 'summary'],
    queryFn: () => expensesApi.getSummary(groupId),
    enabled: !!groupId,
  });
}

export function useCreateExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      expensesApi.createExpense(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
    },
  });
}

export function useSettleExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.settleExpense(groupId, expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
    },
  });
}
