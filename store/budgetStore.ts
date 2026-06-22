import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetCategory, Expense } from '../types/budget';
import { subscribeToBudgetChanges, subscribeToExpenseChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

export type PendingOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'category' | 'expense';
  data: any;
  timestamp: number;
};

interface BudgetState {
  categories: BudgetCategory[];
  expenses: Expense[];
  categoryChannel: RealtimeChannel | null;
  expenseChannel: RealtimeChannel | null;
  pendingOperations: PendingOperation[];
  setCategories: (categories: BudgetCategory[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  addCategory: (category: BudgetCategory) => void;
  addExpense: (expense: Expense) => void;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addPendingOperation: (operation: PendingOperation) => void;
  removePendingOperation: (id: string) => void;
  clearPendingOperations: () => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      categories: [],
      expenses: [],
      categoryChannel: null,
      expenseChannel: null,
      pendingOperations: [],
      setCategories: (categories) => set({ categories }),
      setExpenses: (expenses) => set({ expenses }),
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category],
      })),
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense],
      })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
      })),
      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        ),
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id),
      })),
      addPendingOperation: (operation) => set((state) => ({
        pendingOperations: [...state.pendingOperations, operation],
      })),
      removePendingOperation: (id) => set((state) => ({
        pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
      })),
      clearPendingOperations: () => set({ pendingOperations: [] }),
      subscribeToRealtime: (weddingId) => {
        const state = get();
        
        if (state.categoryChannel) {
          unsubscribeFromChannel(state.categoryChannel);
        }
        if (state.expenseChannel) {
          unsubscribeFromChannel(state.expenseChannel);
        }
        
        const categoryChannel = subscribeToBudgetChanges(weddingId, (payload) => {
          if (payload.event === 'INSERT') {
            set((state) => ({ categories: [...state.categories, payload.new] }));
          } else if (payload.event === 'UPDATE') {
            set((state) => ({
              categories: state.categories.map((cat) =>
                cat.id === payload.new.id ? payload.new : cat
              ),
            }));
          } else if (payload.event === 'DELETE') {
            set((state) => ({
              categories: state.categories.filter((cat) => cat.id !== payload.old.id),
            }));
          }
        });
        
        const expenseChannel = subscribeToExpenseChanges(weddingId, (payload) => {
          if (payload.event === 'INSERT') {
            set((state) => ({ expenses: [...state.expenses, payload.new] }));
          } else if (payload.event === 'UPDATE') {
            set((state) => ({
              expenses: state.expenses.map((exp) =>
                exp.id === payload.new.id ? payload.new : exp
              ),
            }));
          } else if (payload.event === 'DELETE') {
            set((state) => ({
              expenses: state.expenses.filter((exp) => exp.id !== payload.old.id),
            }));
          }
        });
        
        set({ categoryChannel, expenseChannel });
      },
      unsubscribeFromRealtime: () => {
        const state = get();
        if (state.categoryChannel) {
          unsubscribeFromChannel(state.categoryChannel);
        }
        if (state.expenseChannel) {
          unsubscribeFromChannel(state.expenseChannel);
        }
        set({ categoryChannel: null, expenseChannel: null });
      },
      clearStore: () => {
        const state = get();
        if (state.categoryChannel) {
          unsubscribeFromChannel(state.categoryChannel);
        }
        if (state.expenseChannel) {
          unsubscribeFromChannel(state.expenseChannel);
        }
        set({ categories: [], expenses: [], categoryChannel: null, expenseChannel: null });
      },
    }),
    {
      name: 'budget-storage',
      partialize: (state) => ({
        categories: state.categories,
        expenses: state.expenses,
        pendingOperations: state.pendingOperations,
      }),
    }
  )
);
