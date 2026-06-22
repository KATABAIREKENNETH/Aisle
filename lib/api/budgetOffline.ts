import { useBudgetStore } from '../../store/budgetStore';
import { generateOperationId } from '../sync';
import type { PendingOperation } from '../../store/budgetStore';
import type { BudgetCategory, Expense, ExpenseFormData } from '../../types/budget';
import {
  createBudgetCategory as dbCreateBudgetCategory,
  updateBudgetCategory as dbUpdateBudgetCategory,
  createExpense as dbCreateExpense,
  updateExpense as dbUpdateExpense,
  deleteExpense as dbDeleteExpense,
} from './budget';

// Check if we're online
function isOnline(): boolean {
  return navigator.onLine;
}

// Offline-aware budget category operations
export async function createBudgetCategory(
  weddingId: string,
  name: string,
  budgetAmount: number
): Promise<BudgetCategory> {
  if (isOnline()) {
    return await dbCreateBudgetCategory(weddingId, name, budgetAmount);
  }

  // Offline: Create locally and queue for sync
  const tempId = `temp-${generateOperationId()}`;
  const tempCategory: BudgetCategory = {
    id: tempId,
    wedding_id: weddingId,
    name,
    budget_amount: budgetAmount,
    spent_amount: 0,
    created_at: new Date().toISOString(),
  };

  // Add to store locally
  const store = useBudgetStore.getState();
  store.addCategory(tempCategory);

  // Queue for sync
  const operation: PendingOperation = {
    id: generateOperationId(),
    type: 'create',
    entityType: 'category',
    data: {
      wedding_id: weddingId,
      name,
      budget_amount: budgetAmount,
      tempId,
    },
    timestamp: Date.now(),
  };
  store.addPendingOperation(operation);

  return tempCategory;
}

export async function updateBudgetCategory(
  categoryId: string,
  updates: { budget_amount?: number }
): Promise<BudgetCategory> {
  if (isOnline()) {
    return await dbUpdateBudgetCategory(categoryId, updates);
  }

  // Offline: Update locally and queue for sync
  const store = useBudgetStore.getState();
  const category = store.categories.find(c => c.id === categoryId);
  
  if (!category) {
    throw new Error('Category not found');
  }

  const updatedCategory = { ...category, ...updates };
  store.updateCategory(categoryId, updates);

  // Queue for sync
  const operation: PendingOperation = {
    id: generateOperationId(),
    type: 'update',
    entityType: 'category',
    data: {
      id: categoryId,
      ...updates,
    },
    timestamp: Date.now(),
  };
  store.addPendingOperation(operation);

  return updatedCategory;
}

export async function createExpense(
  weddingId: string,
  expenseData: ExpenseFormData
): Promise<Expense> {
  if (isOnline()) {
    return await dbCreateExpense(weddingId, expenseData);
  }

  // Offline: Create locally and queue for sync
  const tempId = `temp-${generateOperationId()}`;
  const tempExpense: Expense = {
    id: tempId,
    wedding_id: weddingId,
    title: expenseData.title,
    amount: parseFloat(expenseData.amount),
    category_id: expenseData.category_id,
    created_at: new Date().toISOString(),
  };

  // Add to store locally
  const store = useBudgetStore.getState();
  store.addExpense(tempExpense);

  // Queue for sync
  const operation: PendingOperation = {
    id: generateOperationId(),
    type: 'create',
    entityType: 'expense',
    data: {
      wedding_id: weddingId,
      ...expenseData,
      tempId,
    },
    timestamp: Date.now(),
  };
  store.addPendingOperation(operation);

  return tempExpense;
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<ExpenseFormData>
): Promise<Expense> {
  if (isOnline()) {
    return await dbUpdateExpense(expenseId, updates);
  }

  // Offline: Update locally and queue for sync
  const store = useBudgetStore.getState();
  const expense = store.expenses.find(e => e.id === expenseId);
  
  if (!expense) {
    throw new Error('Expense not found');
  }

  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.amount !== undefined && updates.amount !== '') {
    dbUpdates.amount = parseFloat(updates.amount);
  }
  if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id;

  const updatedExpense = { ...expense, ...dbUpdates };
  store.updateExpense(expenseId, dbUpdates);

  // Queue for sync
  const operation: PendingOperation = {
    id: generateOperationId(),
    type: 'update',
    entityType: 'expense',
    data: {
      id: expenseId,
      ...updates,
    },
    timestamp: Date.now(),
  };
  store.addPendingOperation(operation);

  return updatedExpense;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  if (isOnline()) {
    return await dbDeleteExpense(expenseId);
  }

  // Offline: Delete locally and queue for sync
  const store = useBudgetStore.getState();
  store.deleteExpense(expenseId);

  // Queue for sync
  const operation: PendingOperation = {
    id: generateOperationId(),
    type: 'delete',
    entityType: 'expense',
    data: {
      id: expenseId,
    },
    timestamp: Date.now(),
  };
  store.addPendingOperation(operation);
}
