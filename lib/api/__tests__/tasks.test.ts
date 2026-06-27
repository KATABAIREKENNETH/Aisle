import { getTasks, getTaskById, createTask, updateTask, deleteTask, toggleTaskStatus } from '../tasks';
import { supabase } from '../../__mocks__/supabase/client';

jest.mock('../../supabase/client', () => ({
  supabase: require('../../__mocks__/supabase/client').supabase,
}));

describe('Tasks API - Integration Tests', () => {
  const mockWeddingId = 'wedding-123';
  const mockTaskId = 'task-123';
  const mockTask = {
    id: mockTaskId,
    wedding_id: mockWeddingId,
    title: 'Test Task',
    category: 'general',
    priority: 'high',
    status: 'pending',
    due_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('getTasks', () => {
    it('should fetch tasks for a wedding', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.order as jest.Mock).mockResolvedValue({ data: [mockTask], error: null });

      const result = await getTasks(mockWeddingId);

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(supabase.eq).toHaveBeenCalledWith('wedding_id', mockWeddingId);
      expect(supabase.order).toHaveBeenCalledWith('due_date', { ascending: true });
      expect(result).toEqual([mockTask]);
    });

    it('should throw error when fetch fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.order as jest.Mock).mockResolvedValue({ data: null, error: new Error('Database error') });

      await expect(getTasks(mockWeddingId)).rejects.toThrow('Database error');
    });
  });

  describe('getTaskById', () => {
    it('should fetch a single task by ID', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: mockTask, error: null });

      const result = await getTaskById(mockTaskId);

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockTaskId);
      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: null, error: new Error('Task not found') });

      await expect(getTaskById(mockTaskId)).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    it('should creating a new task', async () => {
      const taskData = {
        title: 'New Task',
        category: 'general',
        priority: 'medium' as const,
        due_date: '2024-12-31',
      };

      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.insert as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: { ...mockTask, ...taskData }, error: null });

      const result = await createTask(mockWeddingId, taskData);

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(supabase.insert).toHaveBeenCalledWith({ wedding_id: mockWeddingId, ...taskData });
      expect(result).toHaveProperty('title', 'New Task');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const updates = { title: 'Updated Task', status: 'completed' as const };

      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: { ...mockTask, ...updates }, error: null });

      const result = await updateTask(mockTaskId, updates);

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockTaskId);
      expect(result).toHaveProperty('title', 'Updated Task');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.delete as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockResolvedValue({ error: null });

      await deleteTask(mockTaskId);

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockTaskId);
    });

    it('should throw error when delete fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.delete as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockResolvedValue({ error: new Error('Delete failed') });

      await expect(deleteTask(mockTaskId)).rejects.toThrow('Delete failed');
    });
  });

  describe('toggleTaskStatus', () => {
    it('should toggle task status to completed', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockTask, status: 'completed', completed_at: '2024-01-01T00:00:00Z' }, 
        error: null 
      });

      const result = await toggleTaskStatus(mockTaskId, 'completed');

      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', completed_at: expect.any(String) })
      );
      expect(result).toHaveProperty('status', 'completed');
    });

    it('should toggle task status to pending', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockTask, status: 'pending' }, 
        error: null 
      });

      const result = await toggleTaskStatus(mockTaskId, 'pending');

      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
      expect(result).toHaveProperty('status', 'pending');
    });
  });
});
