import type { User } from './auth.types';

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'activity' | 'other';

export interface ExpenseParticipant {
  user: User;
  share: number;
  settled: boolean;
}

export interface Expense {
  _id: string;
  group: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: User;
  participants: ExpenseParticipant[];
  notes?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface DebtSummary {
  from: string;
  to: string;
  amount: number;
}
