import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as tasksService from '../../services/tasks.service';

jest.mock('../../services/tasks.service');

describe('Tasks Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task_123',
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'medium',
        createdById: 'user_123',
        createdBy: {
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        },
        assigneeId: null,
        assignee: null,
        dueDate: null,
        completedAt: null,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (tasksService.createTask as jest.MockedFunction<typeof tasksService.createTask>)
        .mockResolvedValue(mockTask as any);

      const result = await tasksService.createTask('user_123', {
        title: 'Test Task',
        description: 'Test description',
      });

      expect(result).toEqual(mockTask);
      expect(result.status).toBe('todo');
    });

    it('should create task with assignee', async () => {
      const mockTask = {
        id: 'task_123',
        title: 'Assigned Task',
        assigneeId: 'user_456',
        assignee: {
          id: 'user_456',
          name: 'Assignee User',
          email: 'assignee@example.com',
        },
      };

      (tasksService.createTask as jest.MockedFunction<typeof tasksService.createTask>)
        .mockResolvedValue(mockTask as any);

      const result = await tasksService.createTask('user_123', {
        title: 'Assigned Task',
        assigneeId: 'user_456',
      });

      expect(result.assigneeId).toBe('user_456');
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks for a user', async () => {
      const mockTasks = [
        {
          id: 'task_1',
          title: 'Task 1',
          status: 'todo',
          priority: 'high',
        },
        {
          id: 'task_2',
          title: 'Task 2',
          status: 'in_progress',
          priority: 'medium',
        },
      ];

      (tasksService.getTasks as jest.MockedFunction<typeof tasksService.getTasks>)
        .mockResolvedValue(mockTasks as any);

      const result = await tasksService.getTasks('user_123');

      expect(result).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: 'task_1',
          title: 'Done Task',
          status: 'done',
        },
      ];

      (tasksService.getTasks as jest.MockedFunction<typeof tasksService.getTasks>)
        .mockResolvedValue(mockTasks as any);

      await tasksService.getTasks('user_123', { status: 'done' });

      expect(tasksService.getTasks).toHaveBeenCalledWith('user_123', { status: 'done' });
    });

    it('should filter tasks by priority', async () => {
      const mockTasks = [
        {
          id: 'task_1',
          title: 'Urgent Task',
          priority: 'urgent',
        },
      ];

      (tasksService.getTasks as jest.MockedFunction<typeof tasksService.getTasks>)
        .mockResolvedValue(mockTasks as any);

      await tasksService.getTasks('user_123', { priority: 'urgent' });

      expect(tasksService.getTasks).toHaveBeenCalledWith('user_123', { priority: 'urgent' });
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const mockUpdated = {
        id: 'task_123',
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high',
      };

      (tasksService.updateTask as jest.MockedFunction<typeof tasksService.updateTask>)
        .mockResolvedValue(mockUpdated as any);

      const result = await tasksService.updateTask('task_123', 'user_123', {
        status: 'in_progress',
        priority: 'high',
      });

      expect(result.status).toBe('in_progress');
      expect(result.priority).toBe('high');
    });

    it('should set completedAt when status changes to done', async () => {
      const completedDate = new Date();
      const mockCompleted = {
        id: 'task_123',
        title: 'Completed Task',
        status: 'done',
        completedAt: completedDate,
      };

      (tasksService.updateTask as jest.MockedFunction<typeof tasksService.updateTask>)
        .mockResolvedValue(mockCompleted as any);

      const result = await tasksService.updateTask('task_123', 'user_123', {
        status: 'done',
      });

      expect(result.status).toBe('done');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      (tasksService.deleteTask as jest.MockedFunction<typeof tasksService.deleteTask>)
        .mockResolvedValue({ success: true });

      const result = await tasksService.deleteTask('task_123', 'user_123');

      expect(result).toEqual({ success: true });
    });

    it('should throw error for unauthorized deletion', async () => {
      (tasksService.deleteTask as jest.MockedFunction<typeof tasksService.deleteTask>)
        .mockRejectedValue(new Error('Task not found or unauthorized'));

      await expect(
        tasksService.deleteTask('task_123', 'user_456')
      ).rejects.toThrow('Task not found or unauthorized');
    });
  });
});

