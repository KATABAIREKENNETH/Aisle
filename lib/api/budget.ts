import { supabase } from '../supabase/client';
import type { BudgetCategory, Expense, ExpenseFormData } from '../../types/budget';

export async function getBudgetCategories(weddingId: string) {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('wedding_id', weddingId);

  if (error) throw error;
  return data as BudgetCategory[];
}

export async function getExpenses(weddingId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data as Expense[];
}

export async function createBudgetCategory(weddingId: string, name: string, budgetAmount: number) {
  const { data, error } = await supabase
    .from('budget_categories')
    .insert({
      wedding_id: weddingId,
      name,
      budget_amount: budgetAmount,
      spent_amount: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BudgetCategory;
}

export async function updateBudgetCategory(categoryId: string, updates: { budget_amount?: number }) {
  const { data, error } = await supabase
    .from('budget_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as BudgetCategory;
}

export async function createExpense(weddingId: string, expenseData: ExpenseFormData) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      wedding_id: weddingId,
      ...expenseData,
      amount: parseFloat(expenseData.amount),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(expenseId: string, updates: Partial<ExpenseFormData>) {
  const dbUpdates: any = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.amount !== undefined && updates.amount !== '') {
    dbUpdates.amount = parseFloat(updates.amount);
  }
  if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id;
  if (updates.payment_date !== undefined) dbUpdates.payment_date = updates.payment_date;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.vendor_id !== undefined) dbUpdates.vendor_id = updates.vendor_id;
  if (updates.receipt_url !== undefined) dbUpdates.receipt_url = updates.receipt_url;

  const { data, error } = await supabase
    .from('expenses')
    .update(dbUpdates)
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) throw error;
}
