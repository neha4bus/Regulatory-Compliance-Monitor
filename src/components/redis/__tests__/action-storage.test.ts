/**
 * Tests for Action Item Storage
 */

import { ActionItemStorage } from '../action-storage';
import { RedisConnection } from '../config';
import { ActionItem } from '../../../types/models';

// Mock Redis connection
const mockRedisClient = {
  hSet: jest.fn(),
  hGetAll: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn()
};

const mockRedisConnection = {
  getClient: () => mockRedisClient
} as unknown as RedisConnection;

describe('ActionItemStorage', () => {
  let storage: ActionItemStorage;
  let mockActionItem: ActionItem;

  beforeEach(() => {
    storage = new ActionItemStorage(mockRedisConnection);
    jest.clearAllMocks();

    mockActionItem = {
      id: 'action-001',
      regulationId: 'reg-001',
      title: 'Test Action Item',
      description: 'Test description',
      priority: 'high',
      status: 'pending',
      createdAt: new Date('2025-01-08T10:00:00Z'),
      updatedAt: new Date('2025-01-08T10:00:00Z'),
      category: 'compliance',
      tags: ['test', 'compliance'],
      assignedTo: 'john.doe@company.com',
      dueDate: new Date('2025-02-08T10:00:00Z'),
      estimatedHours: 8
    };
  });

  describe('saveActionItem', () => {
    it('should save action item to Redis with correct data structure', async () => {
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.sAdd.mockResolvedValue(1);

      const result = await storage.saveActionItem(mockActionItem);

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        'action:action-001',
        expect.objectContaining({
          id: 'action-001',
          regulationId: 'reg-001',
          title: 'Test Action Item',
          description: 'Test description',
          priority: 'high',
          status: 'pending',
          category: 'compliance',
          assignedTo: 'john.doe@company.com',
          tags: JSON.stringify(['test', 'compliance']),
          estimatedHours: '8'
        })
      );

      expect(result).toEqual(mockActionItem);
    });

    it('should update indexes when saving action item', async () => {
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.sAdd.mockResolvedValue(1);

      await storage.saveActionItem(mockActionItem);

      // Verify indexes are updated
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('regulation_actions:reg-001', 'action-001');
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('user_actions:john.doe@company.com', 'action-001');
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('actions_by_status:pending', 'action-001');
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('actions_by_priority:high', 'action-001');
    });
  });

  describe('getActionItem', () => {
    it('should retrieve and parse action item correctly', async () => {
      const mockRedisData = {
        id: 'action-001',
        regulationId: 'reg-001',
        title: 'Test Action Item',
        description: 'Test description',
        priority: 'high',
        status: 'pending',
        createdAt: '2025-01-08T10:00:00.000Z',
        updatedAt: '2025-01-08T10:00:00.000Z',
        category: 'compliance',
        tags: '["test","compliance"]',
        assignedTo: 'john.doe@company.com',
        dueDate: '2025-02-08T10:00:00.000Z',
        estimatedHours: '8'
      };

      mockRedisClient.hGetAll.mockResolvedValue(mockRedisData);

      const result = await storage.getActionItem('action-001');

      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('action:action-001');
      expect(result).toMatchObject({
        id: 'action-001',
        regulationId: 'reg-001',
        title: 'Test Action Item',
        priority: 'high',
        status: 'pending',
        category: 'compliance',
        tags: ['test', 'compliance'],
        assignedTo: 'john.doe@company.com',
        estimatedHours: 8
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.dueDate).toBeInstanceOf(Date);
    });

    it('should return null for non-existent action item', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.getActionItem('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateActionItem', () => {
    it('should update existing action item', async () => {
      // Mock getting existing item
      const existingData = {
        id: 'action-001',
        regulationId: 'reg-001',
        title: 'Test Action Item',
        description: 'Test description',
        priority: 'high',
        status: 'pending',
        createdAt: '2025-01-08T10:00:00.000Z',
        updatedAt: '2025-01-08T10:00:00.000Z',
        category: 'compliance',
        tags: '["test","compliance"]'
      };

      mockRedisClient.hGetAll.mockResolvedValue(existingData);
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.sAdd.mockResolvedValue(1);

      const updates = { status: 'completed' as const, actualHours: 6 };
      const result = await storage.updateActionItem('action-001', updates);

      expect(result?.status).toBe('completed');
      expect(result?.actualHours).toBe(6);
      expect(result?.completedAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent action item', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.updateActionItem('non-existent', { status: 'completed' });

      expect(result).toBeNull();
    });
  });

  describe('getActionItemStats', () => {
    it('should calculate statistics correctly', async () => {
      const mockActionItems = [
        { ...mockActionItem, status: 'pending', priority: 'high', category: 'compliance' },
        { ...mockActionItem, id: 'action-002', status: 'completed', priority: 'medium', category: 'implementation' },
        { ...mockActionItem, id: 'action-003', status: 'in_progress', priority: 'critical', category: 'compliance' }
      ];

      // Mock the keys and individual gets
      mockRedisClient.keys.mockResolvedValue(['action:action-001', 'action:action-002', 'action:action-003']);
      
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: 'action-001',
          status: 'pending',
          priority: 'high',
          category: 'compliance',
          createdAt: '2025-01-08T10:00:00.000Z',
          updatedAt: '2025-01-08T10:00:00.000Z',
          tags: '[]',
          regulationId: 'reg-001',
          title: 'Test 1',
          description: 'Test'
        })
        .mockResolvedValueOnce({
          id: 'action-002',
          status: 'completed',
          priority: 'medium',
          category: 'implementation',
          createdAt: '2025-01-08T10:00:00.000Z',
          updatedAt: '2025-01-08T10:00:00.000Z',
          tags: '[]',
          regulationId: 'reg-001',
          title: 'Test 2',
          description: 'Test'
        })
        .mockResolvedValueOnce({
          id: 'action-003',
          status: 'in_progress',
          priority: 'critical',
          category: 'compliance',
          createdAt: '2025-01-08T10:00:00.000Z',
          updatedAt: '2025-01-08T10:00:00.000Z',
          tags: '[]',
          regulationId: 'reg-001',
          title: 'Test 3',
          description: 'Test'
        });

      const stats = await storage.getActionItemStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.critical).toBe(1);
      expect(stats.byCategory.compliance).toBe(2);
      expect(stats.byCategory.implementation).toBe(1);
    });
  });

  describe('createActionItemsFromRegulation', () => {
    it('should create action items from compliance checklist', async () => {
      const complianceChecklist = [
        'Install monitoring equipment',
        'Update procedures',
        'Train personnel'
      ];

      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.sAdd.mockResolvedValue(1);

      const result = await storage.createActionItemsFromRegulation(
        'reg-001',
        complianceChecklist,
        'john.doe@company.com'
      );

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Install monitoring equipment');
      expect(result[0].regulationId).toBe('reg-001');
      expect(result[0].assignedTo).toBe('john.doe@company.com');
      expect(result[0].category).toBe('compliance');
      expect(result[0].tags).toContain('auto-generated');
      expect(result[0].tags).toContain('compliance');

      // Verify all items were saved
      expect(mockRedisClient.hSet).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleteActionItem', () => {
    it('should delete action item and remove from indexes', async () => {
      // Mock getting existing item
      const existingData = {
        id: 'action-001',
        regulationId: 'reg-001',
        status: 'pending',
        priority: 'high',
        assignedTo: 'john.doe@company.com',
        createdAt: '2025-01-08T10:00:00.000Z',
        updatedAt: '2025-01-08T10:00:00.000Z',
        tags: '[]',
        title: 'Test',
        description: 'Test',
        category: 'compliance'
      };

      mockRedisClient.hGetAll.mockResolvedValue(existingData);
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.sRem.mockResolvedValue(1);

      const result = await storage.deleteActionItem('action-001');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('action:action-001');
      expect(mockRedisClient.sRem).toHaveBeenCalledWith('regulation_actions:reg-001', 'action-001');
      expect(mockRedisClient.sRem).toHaveBeenCalledWith('user_actions:john.doe@company.com', 'action-001');
    });

    it('should return false for non-existent action item', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.deleteActionItem('non-existent');

      expect(result).toBe(false);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });
});