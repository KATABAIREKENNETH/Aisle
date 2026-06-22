export const TASK_CATEGORIES = [
  'venue',
  'catering',
  'attire',
  'photography',
  'florals',
  'music',
  'decor',
  'guests',
  'general',
] as const;

export const BUDGET_CATEGORIES = [
  { name: 'Venue', defaultBudget: 15000, color: '#FF6B6B' },
  { name: 'Catering', defaultBudget: 12000, color: '#4ECDC4' },
  { name: 'Photography', defaultBudget: 5000, color: '#45B7D1' },
  { name: 'Florals', defaultBudget: 3000, color: '#96CEB4' },
  { name: 'Attire', defaultBudget: 4000, color: '#FFEAA7' },
  { name: 'Music', defaultBudget: 3000, color: '#DDA0DD' },
  { name: 'Decor', defaultBudget: 4000, color: '#98D8C8' },
  { name: 'Other', defaultBudget: 4000, color: '#F7DC6F' },
] as const;

export const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Florals',
  'Music',
  'Cake',
  'Decor',
  'Attire',
  'Beauty',
  'Transportation',
  'Officiant',
  'Other',
] as const;

export const GUEST_GROUPS = [
  'family',
  'friends',
  'coworkers',
  'partners-family',
  'partners-friends',
  'other',
] as const;

export const WEDDING_SIZES = {
  intimate: { min: 0, max: 50 },
  medium: { min: 50, max: 150 },
  large: { min: 150, max: Infinity },
} as const;
