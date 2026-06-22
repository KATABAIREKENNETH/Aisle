import { create } from 'zustand';
import type { Task, TaskStatus } from '../types/task';
import { subscribeToTaskChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TaskState {
  tasks: Task[];
  selectedCategory: string;
  channel: RealtimeChannel | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setSelectedCategory: (category: string) => void;
  toggleTaskStatus: (id: string, status: TaskStatus) => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedCategory: 'all',
  channel: null as any,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  })),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  toggleTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, status } : task
    ),
  })),
  subscribeToRealtime: (weddingId) => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    
    const channel = subscribeToTaskChanges(weddingId, (payload) => {
      if (payload.event === 'INSERT') {
        set((state) => ({ tasks: [...state.tasks, payload.new] }));
      } else if (payload.event === 'UPDATE') {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === payload.new.id ? payload.new : task
          ),
        }));
      } else if (payload.event === 'DELETE') {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== payload.old.id),
        }));
      }
    });
    
    set({ channel });
  },
  unsubscribeFromRealtime: () => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
      set({ channel: null });
    }
  },
  clearStore: () => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    set({ tasks: [], selectedCategory: 'all', channel: null });
  },
}));
