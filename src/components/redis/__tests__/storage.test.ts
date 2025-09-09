/**
 * Tests for Redis storage utilities
 */

import { RegulationStorage } from '../storage';
import { RedisConnection } from '../config';
import { Regulation } from '../../../types/models';

// Mock Redis client
const mockRedisClient = {
  hSet: jest.fn(),
  hGetAll: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  zAdd: jest.fn(),
  lPush: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
  zRem: jest.fn(),
  lRem: jest.fn(),
  zScore: jest.fn(),
  zRevRangeByScore: jest.fn(),
};

const mockRedisConnection = {
  getClient: jest.fn(() => mockRedisClient),
} as unknown as RedisConnection;

describe('RegulationStorage', () => {
  let storage: RegulationStorage;
  let sampleRegulation: Omit<Regulation, 'hash'>;

  beforeEach(() => {
    storage = new RegulationStorage(mockRedisConnection);
    sampleRegulation = {
      id: 'test-reg-1',
      title: 'Test Regulation',
      date: new Date('2025-01-08'),
      url: 'https://example.com/reg1',
      fullText: 'This is a test regulation text.',
      source: 'EPA',
      scrapedAt: new Date('2025-01-08T10:00:00Z'),
      status: 'new',
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('saveRegulation', () => {
    it('should save regulation with generated hash', async () => {
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.zAdd.mockResolvedValue(1);
      mockRedisClient.lPush.mockResolvedValue(1);

      const result = await storage.saveRegulation(sampleRegulation);

      expect(result.hash).toBeDefined();
      expect(result.hash).toHaveLength(64); // SHA256 hash length
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        'regulation:test-reg-1',
        expect.objectContaining({
          id: 'test-reg-1',
          title: 'Test Regulation',
          hash: expect.any(String),
        })
      );
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `regulation_hash:${result.hash}`,
        'test-reg-1'
      );
      expect(mockRedisClient.zAdd).toHaveBeenCalledWith(
        'changes_timeline',
        expect.objectContaining({
          score: expect.any(Number),
          value: 'test-reg-1',
        })
      );
      expect(mockRedisClient.lPush).toHaveBeenCalledWith('pending_analysis', 'test-reg-1');
    });

    it('should not add to pending_analysis if status is not new', async () => {
      const analyzedRegulation = { ...sampleRegulation, status: 'analyzed' as const };
      
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.zAdd.mockResolvedValue(1);

      await storage.saveRegulation(analyzedRegulation);

      expect(mockRedisClient.lPush).not.toHaveBeenCalled();
    });
  });

  describe('getRegulation', () => {
    it('should retrieve regulation by ID', async () => {
      const mockData = {
        id: 'test-reg-1',
        title: 'Test Regulation',
        date: '2025-01-08T00:00:00.000Z',
        url: 'https://example.com/reg1',
        fullText: 'This is a test regulation text.',
        source: 'EPA',
        scrapedAt: '2025-01-08T10:00:00.000Z',
        status: 'new',
        hash: 'test-hash',
      };

      mockRedisClient.hGetAll.mockResolvedValue(mockData);

      const result = await storage.getRegulation('test-reg-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-reg-1');
      expect(result?.date).toBeInstanceOf(Date);
      expect(result?.scrapedAt).toBeInstanceOf(Date);
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('regulation:test-reg-1');
    });

    it('should return null if regulation not found', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.getRegulation('non-existent');

      expect(result).toBeNull();
    });

    it('should parse JSON fields correctly', async () => {
      const mockData = {
        id: 'test-reg-1',
        title: 'Test Regulation',
        date: '2025-01-08T00:00:00.000Z',
        scrapedAt: '2025-01-08T10:00:00.000Z',
        riskScore: '8.5',
        insights: JSON.stringify({
          whatChanged: 'New emission standards',
          whoImpacted: ['Oil companies'],
          requiredActions: ['Update procedures'],
        }),
        complianceChecklist: JSON.stringify(['Review procedures', 'Train staff']),
      };

      mockRedisClient.hGetAll.mockResolvedValue(mockData);

      const result = await storage.getRegulation('test-reg-1');

      expect(result?.riskScore).toBe(8.5);
      expect(result?.insights).toEqual({
        whatChanged: 'New emission standards',
        whoImpacted: ['Oil companies'],
        requiredActions: ['Update procedures'],
      });
      expect(result?.complianceChecklist).toEqual(['Review procedures', 'Train staff']);
    });
  });

  describe('updateRegulation', () => {
    it('should update existing regulation', async () => {
      const existingRegulation = { ...sampleRegulation, hash: 'existing-hash' };
      
      // Mock getRegulation to return existing regulation
      mockRedisClient.hGetAll.mockResolvedValue({
        ...existingRegulation,
        date: existingRegulation.date.toISOString(),
        scrapedAt: existingRegulation.scrapedAt.toISOString(),
      });

      // Mock saveRegulation operations
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.zAdd.mockResolvedValue(1);

      const updates = { status: 'analyzed' as const, riskScore: 7.5 };
      const result = await storage.updateRegulation('test-reg-1', updates);

      expect(result).toBeDefined();
      expect(result?.status).toBe('analyzed');
      expect(result?.riskScore).toBe(7.5);
    });

    it('should return null if regulation does not exist', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.updateRegulation('non-existent', { status: 'analyzed' });

      expect(result).toBeNull();
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicate regulation', async () => {
      mockRedisClient.get.mockResolvedValue('existing-reg-id');

      const result = await storage.isDuplicate(sampleRegulation);

      expect(result).toBe('existing-reg-id');
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringMatching(/^regulation_hash:/)
      );
    });

    it('should return null for non-duplicate regulation', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await storage.isDuplicate(sampleRegulation);

      expect(result).toBeNull();
    });
  });

  describe('getAllRegulations', () => {
    it('should retrieve all regulations', async () => {
      mockRedisClient.keys.mockResolvedValue(['regulation:reg1', 'regulation:reg2']);
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: 'reg1',
          title: 'Regulation 1',
          date: '2025-01-08T00:00:00.000Z',
          scrapedAt: '2025-01-08T10:00:00.000Z',
          status: 'new',
        })
        .mockResolvedValueOnce({
          id: 'reg2',
          title: 'Regulation 2',
          date: '2025-01-07T00:00:00.000Z',
          scrapedAt: '2025-01-07T10:00:00.000Z',
          status: 'analyzed',
        });

      const result = await storage.getAllRegulations();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('reg1'); // Newer first
      expect(result[1].id).toBe('reg2');
    });

    it('should filter by status', async () => {
      mockRedisClient.keys.mockResolvedValue(['regulation:reg1', 'regulation:reg2']);
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: 'reg1',
          status: 'new',
          date: '2025-01-08T00:00:00.000Z',
          scrapedAt: '2025-01-08T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'reg2',
          status: 'analyzed',
          date: '2025-01-07T00:00:00.000Z',
          scrapedAt: '2025-01-07T10:00:00.000Z',
        });

      const result = await storage.getAllRegulations({ status: 'new' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('new');
    });

    it('should apply pagination', async () => {
      mockRedisClient.keys.mockResolvedValue(['regulation:reg1', 'regulation:reg2', 'regulation:reg3']);
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: 'reg1',
          date: '2025-01-08T00:00:00.000Z',
          scrapedAt: '2025-01-08T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'reg2',
          date: '2025-01-07T00:00:00.000Z',
          scrapedAt: '2025-01-07T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'reg3',
          date: '2025-01-06T00:00:00.000Z',
          scrapedAt: '2025-01-06T10:00:00.000Z',
        });

      const result = await storage.getAllRegulations({ limit: 2, offset: 1 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('reg2');
      expect(result[1].id).toBe('reg3');
    });
  });

  describe('deleteRegulation', () => {
    it('should delete regulation and cleanup references', async () => {
      const regulationData = {
        id: 'test-reg-1',
        hash: 'test-hash',
        date: '2025-01-08T00:00:00.000Z',
        scrapedAt: '2025-01-08T10:00:00.000Z',
      };

      mockRedisClient.hGetAll.mockResolvedValue(regulationData);
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.zRem.mockResolvedValue(1);
      mockRedisClient.lRem.mockResolvedValue(1);

      const result = await storage.deleteRegulation('test-reg-1');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('regulation:test-reg-1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('regulation_hash:test-hash');
      expect(mockRedisClient.zRem).toHaveBeenCalledWith('changes_timeline', 'test-reg-1');
      expect(mockRedisClient.lRem).toHaveBeenCalledWith('pending_analysis', 0, 'test-reg-1');
    });

    it('should return false if regulation does not exist', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await storage.deleteRegulation('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getRegulationCounts', () => {
    it('should return counts by status', async () => {
      mockRedisClient.keys.mockResolvedValue(['regulation:reg1', 'regulation:reg2', 'regulation:reg3']);
      mockRedisClient.hGetAll
        .mockResolvedValueOnce({
          id: 'reg1',
          status: 'new',
          date: '2025-01-08T00:00:00.000Z',
          scrapedAt: '2025-01-08T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'reg2',
          status: 'new',
          date: '2025-01-07T00:00:00.000Z',
          scrapedAt: '2025-01-07T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          id: 'reg3',
          status: 'analyzed',
          date: '2025-01-06T00:00:00.000Z',
          scrapedAt: '2025-01-06T10:00:00.000Z',
        });

      const result = await storage.getRegulationCounts();

      expect(result).toEqual({
        new: 2,
        analyzed: 1,
        reviewed: 0,
        archived: 0,
      });
    });
  });
});