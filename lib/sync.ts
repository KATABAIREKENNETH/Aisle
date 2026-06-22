import { supabase } from './supabase/client';
import type { PendingOperation } from '../store/budgetStore';
import { createBudgetCategory, updateBudgetCategory, createExpense, updateExpense, deleteExpense } from './api/budget';

export async function syncPendingOperations(
  operations: PendingOperation[],
  onOperationComplete: (id: string) => void,
  onOperationFail: (id: string) => void
) {
  const results = {
    successful: 0,
    failed: 0,
  };

  // Sort operations by timestamp to sync in order
  const sortedOperations = [...operations].sort((a, b) => a.timestamp - b.timestamp);

  for (const operation of sortedOperations) {
    try {
      await syncSingleOperation(operation);
      onOperationComplete(operation.id);
      results.successful++;
    } catch (error) {
      console.error(`Failed to sync operation ${operation.id}:`, error);
      onOperationFail(operation.id);
      results.failed++;
    }
  }

  return results;
}

async function syncSingleOperation(operation: PendingOperation) {
  switch (operation.entityType) {
    case 'category':
      await syncCategoryOperation(operation);
      break;
    case 'expense':
      await syncExpenseOperation(operation);
      break;
    default:
      throw new Error(`Unknown entity type: ${operation.entityType}`);
  }
}

async function syncCategoryOperation(operation: PendingOperation) {
  const { type, data } = operation;

  switch (type) {
    case 'create':
      await createBudgetCategory(data.wedding_id, data.name, data.budget_amount);
      break;
    case 'update':
      await updateBudgetCategory(data.id, { budget_amount: data.budget_amount });
      break;
    case 'delete':
      // Note: We don't have a delete category API function yet
      // This would need to be implemented
      console.warn('Delete category operation not yet implemented');
      break;
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

async function syncExpenseOperation(operation: PendingOperation) {
  const { type, data } = operation;

  switch (type) {
    case 'create':
      await createExpense(data.wedding_id, {
        title: data.title,
        amount: data.amount,
        category_id: data.category_id,
      });
      break;
    case 'update':
      await updateExpense(data.id, {
        title: data.title,
        amount: data.amount,
        category_id: data.category_id,
      });
      break;
    case 'delete':
      await deleteExpense(data.id);
      break;
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

export function generateOperationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
