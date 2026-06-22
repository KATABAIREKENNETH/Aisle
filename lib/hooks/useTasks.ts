import { useEffect } from 'react';
import { useWeddingStore } from '../../store/weddingStore';
import { useTaskStore } from '../../store/taskStore';
import { getTasks } from '../api/tasks';

export function useTasks() {
  const { wedding } = useWeddingStore();
  const { tasks, setTasks } = useTaskStore();

  useEffect(() => {
    async function loadTasks() {
      if (!wedding) return;

      try {
        const tasksData = await getTasks(wedding.id);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }

    loadTasks();
  }, [wedding, setTasks]);

  return { tasks };
}
