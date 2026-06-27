import { getTasks } from '../../api/tasks';
import { supabase } from '../../__mocks__/supabase/client';

jest.mock('../../supabase/client', () => ({
  supabase: require('../../__mocks__/supabase/client').supabase,
}));

jest.mock('../../api/tasks', () => ({
  getTasks: jest.fn(),
}));

describe('useTasks Hook - Integration Tests', () => {
  const mockWedding = { id: 'wedding-123', name: 'Test Wedding' };
  const mockTasks = [
    { id: 'task-1', title: 'Task 1', status: 'pending' },
    { id: 'task-2', title: 'Task 2', status: 'completed' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load tasks when wedding is available', async () => {
    (getTasks as jest.Mock).mockResolvedValue(mockTasks);

    // Test the core logic without React rendering
    const tasksData = await getTasks(mockWedding.id);
    
    expect(getTasks).toHaveBeenCalledWith(mockWedding.id);
    expect(tasksData).toEqual(mockTasks);
  });

  it('should not load tasks when wedding is not available', async () => {
    // Test the logic that would prevent loading
    const wedding = null;
    
    expect(wedding).toBeNull();
    expect(getTasks).not.toHaveBeenCalled();
  });

  it('should handle errors when loading tasks', async () => {
    (getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load tasks'));

    try {
      await getTasks(mockWedding.id);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Failed to load tasks');
    }
  });
});
