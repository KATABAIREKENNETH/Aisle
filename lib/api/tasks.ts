import { supabase } from '../supabase/client';
import type { Task, TaskFormData } from '../../types';

export async function getTasks(weddingId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

export async function getTaskById(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data as Task;
}

export async function createTask(weddingId: string, taskData: TaskFormData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      wedding_id: weddingId,
      ...taskData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<TaskFormData>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function toggleTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed') {
  const updates: any = { status };
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}
