// Supabase configuration
// This file will be used to store Supabase-related configuration
// After setting up Supabase, you can add table names, constants, etc.

export const SUPABASE_TABLES = {
  PROFILES: 'profiles',
  WEDDINGS: 'weddings',
  TASKS: 'tasks',
  BUDGET_CATEGORIES: 'budget_categories',
  EXPENSES: 'expenses',
  VENDORS: 'vendors',
  GUESTS: 'guests',
  APPOINTMENTS: 'appointments',
  MESSAGES: 'messages',
  ACTIVITY_LOG: 'activity_log',
} as const;
