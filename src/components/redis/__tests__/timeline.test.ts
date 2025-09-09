/**
 * Tests for change tracking and timeline functionality
 */

import { ChangeTracker, ChangeEvent } from '../timeline';
import { RedisConnection } from '../config';

// Mock Redis client
const mockRedisClient = {
  hSet: jest.fn(),
  hGetAll: jest.fn(),
  zAdd: jest.fn(),
  zRangeWithScores: jest.fn(),
  zScore: jest.fn(),
  zRemRangeByScore: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
  hGet: jest.fn(),
};

const mockRedisConnection = {
  getClient: jest.fn(() => mockRedisClient),
} as unknown as RedisConnection;

describe('ChangeTracker', () => {
  let changeTracker: ChangeTracker;

  beforeEach(() => {
    changeTracker = new ChangeTracker(mockRedisConnection);
    jest.clearAllMocks();
  });

  describe('recordChange', () => {
    it('should record a change event', async () => {
      const timestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.zAdd.mockResolvedValue(1);

      const details = { oldStatus: 'new', newStatus: 'analyzed' };
      await changeTracker.recordChange('test-reg-1', 'status_changed', details);

      const expectedChangeId = `test-reg-1_status_changed_${timestamp}`;

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `change:${expectedChangeId}`,
        expect.objectContaining({
          id: expectedChangeId,
          regulationId: 'test-reg-1',
          changeType: 'status_changed',
          timestamp: timestamp.toString(),
          details: JSON.stringify(details),
        })
      );

      expect(mockRedisClient.zAdd).toHaveBeenCalledWith(
        'changes_timeline',
        {
          score: timestamp,
          value: expectedChangeId,
        }
      );

      expect(mockRedisClient.zAdd).toHaveBeenCalledWith(
        'regulation_timeline:test-reg-1',
        {
          score: timestamp,
          value: expectedChangeId,
        }
      );

      jest.restoreAllMocks();
    });

    it('should record change with empty details', async () => {
      const timestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.zAdd.mockResolvedValue(1);

      await changeTracker.recordChange('test-reg-1', 'created');

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          details: JSON.stringify({}),
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('getTimeline', () => {
    it('should get timeline entries within time range', async () => {
      const startTime = Date.now() - 86400000; // 24 hours ago
      const endTime = Date.now();

      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: 'test-reg-1', score: endTime - 3600000 }, // 1 hour ago
        { value: 'test-reg-2', score: endTime - 7200000 }, // 2 hours ago
        { value: 'test-reg-3', score: startTime - 3600000 }, // Outside range
      ]);

      const result = await changeTracker.getTimeline({
        startTime,
        endTime,
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].regulationId).toBe('test-reg-1'); // Newest first
      expect(result[0].timestamp).toBe(endTime - 3600000);
      expect(result[0].date).toBeInstanceOf(Date);

      expect(mockRedisClient.zRangeWithScores).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        -1
      );
    });

    it('should use default values for optional parameters', async () => {
      mockRedisClient.zRangeWithScores.mockResolvedValue([]);

      await changeTracker.getTimeline();

      expect(mockRedisClient.zRangeWithScores).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        -1
      );
    });

    it('should skip change event IDs in timeline', async () => {
      const now = Date.now();
      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: 'test-reg-1', score: now - 3600000 },
        { value: 'test-reg-1_created_1234567890', score: now - 1800000 }, // This should be skipped
        { value: 'test-reg-2', score: now - 7200000 },
      ]);

      const result = await changeTracker.getTimeline();

      expect(result).toHaveLength(2);
      expect(result[0].regulationId).toBe('test-reg-1');
      expect(result[1].regulationId).toBe('test-reg-2');
    });
  });

  describe('getRegulationHistory', () => {
    it('should get change history for specific regulation', async () => {
      const changeId1 = 'test-reg-1_created_1234567890';
      const changeId2 = 'test-reg-1_status_changed_1234567891';

      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: changeId1, score: 1234567890 },
        { value: changeId2, score: 1234567891 },
      ]);
      
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: changeId1,
          regulationId: 'test-reg-1',
          changeType: 'created',
          timestamp: '1234567890',
          date: '2025-01-08T10:00:00.000Z',
          details: '{}',
        })
        .mockResolvedValueOnce({
          id: changeId2,
          regulationId: 'test-reg-1',
          changeType: 'status_changed',
          timestamp: '1234567891',
          date: '2025-01-08T10:01:00.000Z',
          details: '{"oldStatus":"new","newStatus":"analyzed"}',
        });

      const result = await changeTracker.getRegulationHistory('test-reg-1');

      expect(result).toHaveLength(2);
      expect(result[0].changeType).toBe('created');
      expect(result[0].timestamp).toBe(1234567890);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].details).toEqual({});

      expect(result[1].changeType).toBe('status_changed');
      expect(result[1].details).toEqual({
        oldStatus: 'new',
        newStatus: 'analyzed',
      });

      expect(mockRedisClient.zRangeWithScores).toHaveBeenCalledWith(
        'regulation_timeline:test-reg-1',
        0,
        -1
      );
    });

    it('should handle empty history', async () => {
      mockRedisClient.zRangeWithScores.mockResolvedValue([]);

      const result = await changeTracker.getRegulationHistory('test-reg-1');

      expect(result).toHaveLength(0);
    });

    it('should skip invalid change records', async () => {
      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: 'invalid-change-id', score: 1234567890 }
      ]);
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await changeTracker.getRegulationHistory('test-reg-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getRecentChanges', () => {
    it('should get recent changes', async () => {
      const changeId1 = 'test-reg-1_created_1234567890';
      const changeId2 = 'test-reg-2_updated_1234567891';

      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: changeId1, score: 1234567890 },
        { value: 'test-reg-1', score: 1234567889 }, // This should be skipped (no underscores)
        { value: changeId2, score: 1234567891 },
      ]);

      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: changeId1,
          regulationId: 'test-reg-1',
          changeType: 'created',
          timestamp: '1234567890',
          date: '2025-01-08T10:00:00.000Z',
          details: '{}',
        })
        .mockResolvedValueOnce({
          id: changeId2,
          regulationId: 'test-reg-2',
          changeType: 'updated',
          timestamp: '1234567891',
          date: '2025-01-08T10:01:00.000Z',
          details: '{"field":"title"}',
        });

      const result = await changeTracker.getRecentChanges(10);

      expect(result).toHaveLength(2);
      expect(result[0].changeType).toBe('created');
      expect(result[1].changeType).toBe('updated');

      expect(mockRedisClient.zRangeWithScores).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        -1
      );
    });

    it('should use default limit', async () => {
      mockRedisClient.zRangeWithScores.mockResolvedValue([]);

      await changeTracker.getRecentChanges();

      expect(mockRedisClient.zRangeWithScores).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        -1
      );
    });
  });

  describe('getChangesByType', () => {
    it('should get changes by specific type', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'change:test-reg-1_created_1234567890',
        'change:test-reg-2_status_changed_1234567891',
        'change:test-reg-3_created_1234567892',
      ]);

      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          changeType: 'created',
          timestamp: '1234567890',
          date: '2025-01-08T10:00:00.000Z',
          details: '{}',
        })
        .mockResolvedValueOnce({
          changeType: 'status_changed',
          timestamp: '1234567891',
          date: '2025-01-08T10:01:00.000Z',
          details: '{}',
        })
        .mockResolvedValueOnce({
          changeType: 'created',
          timestamp: '1234567892',
          date: '2025-01-08T10:02:00.000Z',
          details: '{}',
        });

      const result = await changeTracker.getChangesByType('created');

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBe(1234567892); // Newest first
      expect(result[1].timestamp).toBe(1234567890);
      expect(result.every(change => change.changeType === 'created')).toBe(true);
    });

    it('should return empty array if no changes of type found', async () => {
      mockRedisClient.keys.mockResolvedValue(['change:test-reg-1_created_1234567890']);
      mockRedisClient.hGetAll.mockResolvedValue({
        changeType: 'created',
        timestamp: '1234567890',
        date: '2025-01-08T10:00:00.000Z',
        details: '{}',
      });

      const result = await changeTracker.getChangesByType('analyzed');

      expect(result).toHaveLength(0);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should cleanup old entries', async () => {
      const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days ago

      mockRedisClient.zRemRangeByScore.mockResolvedValue(5);
      mockRedisClient.keys
        .mockResolvedValueOnce(['change:old1', 'change:old2', 'change:new1'])
        .mockResolvedValueOnce(['regulation_timeline:reg1', 'regulation_timeline:reg2']);

      mockRedisClient.hGet
        .mockResolvedValueOnce((cutoffTime - 1000).toString()) // old
        .mockResolvedValueOnce((cutoffTime - 2000).toString()) // old
        .mockResolvedValueOnce((cutoffTime + 1000).toString()); // new

      mockRedisClient.del.mockResolvedValue(1);

      const result = await changeTracker.cleanupOldEntries(90);

      expect(result).toBe(7); // 5 from timeline + 2 deleted changes
      expect(mockRedisClient.zRemRangeByScore).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        cutoffTime
      );
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2); // Only old changes deleted
    });

    it('should use default cleanup period', async () => {
      mockRedisClient.zRemRangeByScore.mockResolvedValue(0);
      mockRedisClient.keys.mockResolvedValue([]);

      await changeTracker.cleanupOldEntries();

      const expectedCutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      expect(mockRedisClient.zRemRangeByScore).toHaveBeenCalledWith(
        'changes_timeline',
        0,
        expect.any(Number)
      );
    });
  });
});