import { api } from './client';
import type { Expense, DebtSummary } from '../types/expense.types';

export const expensesApi = {
  getExpenses: (groupId: string) =>
    api.get<Expense[]>(`/expenses/${groupId}`).then((r) => r.data),

  getSummary: (groupId: string) =>
    api.get<{ debts: DebtSummary[] }>(`/expenses/${groupId}/summary`).then((r) => r.data),

  createExpense: (groupId: string, data: Record<string, unknown>) =>
    api.post<Expense>(`/expenses/${groupId}`, data).then((r) => r.data),

  updateExpense: (groupId: string, id: string, data: Record<string, unknown>) =>
    api.patch<Expense>(`/expenses/${groupId}/${id}`, data).then((r) => r.data),

  deleteExpense: (groupId: string, id: string) =>
    api.delete(`/expenses/${groupId}/${id}`),

  settleExpense: (groupId: string, id: string) =>
    api.post<Expense>(`/expenses/${groupId}/${id}/settle`).then((r) => r.data),
};
