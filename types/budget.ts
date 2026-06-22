export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  budget_amount: number;
  spent_amount: number;
  created_at: string;
}

export interface Expense {
  id: string;
  wedding_id: string;
  category_id: string;
  vendor_id?: string;
  title: string;
  amount: number;
  payment_date?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseFormData {
  title: string;
  amount: string;
  category_id?: string;
  vendor_id?: string;
  payment_date?: string;
  receipt_url?: string;
  notes?: string;
}
