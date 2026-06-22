export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  wedding_id: string;
  title: string;
  description?: string;
  category: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  category: string;
  due_date?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string;
}
