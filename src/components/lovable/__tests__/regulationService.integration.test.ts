/**
 * Integration tests for RegulationService with Redis backend
 */

import { RegulationService } from '../services/regulationService';
import { RegulationStorage } from '../../redis/storage';
import { RedisConnection } from '../../redis/config';
import { Regulation } from '../../../types';

// Mock Redis components
jest.mock('../../redis/config');
jest.mock('../../redis/storage');

const MockedRedisConnection = RedisConnection as jest.MockedClass<typeof RedisConnection>;
const MockedRegulationStorage = RegulationStorage as jest.MockedClass<typeof RegulationStorage>;

describe('RegulationService Integration Tests', () => {
  let service: RegulationService;
  let mockRedisConnection: jest.Mocked<RedisConnection>;
  let mockStorage: jest.Mocked<RegulationStorage>;

  // Mock regulations data
  const mockRegulations: Regulation[] = [
    {
      id: 'reg-001',
      title: 'New Emission Monitoring Requirements',
      date: new Date('2025-01-01'),
      url: 'https://example.com/reg-001',
      fullText: 'Detailed regulation text about emission monitoring...',
      source: 'EPA',
      scrapedAt: new Date('2025-01-01T10:00:00Z'),
      hash: 'hash-001',
      summary: 'New requirements for continuous emission monitoring on offshore drilling platforms.',
      riskScore: 8.5,
      priority: 'high',
      status: 'analyzed',
      insights: {
        whatChanged: 'Mandatory installation of continuous emission monitoring systems',
        whoImpacted: ['Offshore operators', 'Drilling contractors'],
        requiredActions: ['Install monitoring equipment', 'Train personnel'],
      },
      complianceChecklist: ['Install equipment', 'Train staff'],
    },
    {
      id: 'reg-002',
      title: 'Updated Safety Protocols for Pipeline Operations',
      date: new Date('2024-12-15'),
      url: 'https://example.com/reg-002',
      fullText: 'Safety protocol details for pipeline operations...',
      source: 'PHMSA',
      scrapedAt: new Date('2024-12-15T14:30:00Z'),
      hash: 'hash-002',
      summary: 'Enhanced safety requirements for pipeline maintenance and inspection.',
      riskScore: 6.2,
      priority: 'medium',
      status: 'reviewed',
      insights: {
        whatChanged: 'Increased inspection frequency and new safety procedures',
        whoImpacted: ['Pipeline operators', 'Maintenance crews'],
        requiredActions: ['Update procedures', 'Conduct training'],
      },
      complianceChecklist: ['Review procedures', 'Train personnel'],
    },
    {
      id: 'reg-003',
      title: 'Environmental Impact Assessment Guidelines',
      date: new Date('2024-11-20'),
      url: 'https://example.com/reg-003',
      fullText: 'Environmental impact assessment guidelines...',
      source: 'DOE',
      scrapedAt: new Date('2024-11-20T09:15:00Z'),
      hash: 'hash-003',
      summary: 'New environmental assessment requirements for oil and gas projects.',
      riskScore: 4.1,
      priority: 'low',
      status: 'new',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockRedisConnection = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      getClient: jest.fn(),
    } as any;

    mockStorage = {
      getAllRegulations: jest.fn(),
      getRegulation: jest.fn(),
      saveRegulation: jest.fn(),
      updateRegulation: jest.fn(),
      getRegulationCounts: jest.fn(),
    } as any;

    // Setup constructor mocks
    MockedRedisConnection.mockImplementation(() => mockRedisConnection);
    MockedRegulationStorage.mockImplementation(() => mockStorage);

    // Create service instance
    service = new RegulationService();
  });

  describe('Service Initialization', () => {
    it('initializes Redis connection', async () => {
      await service.initialize();
      
      expect(mockRedisConnection.connect).toHaveBeenCalled();
    });

    it('disconnects from Redis', async () => {
      await service.disconnect();
      
      expect(mockRedisConnection.disconnect).toHaveBeenCalled();
    });
  });

  describe('Get Regulations', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('retrieves all regulations without filters', async () => {
      const result = await service.getRegulations();

      expect(result.regulations).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.totalPages).toBe(1);
    });

    it('applies search query filter', async () => {
      const filters = { searchQuery: 'emission' };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].title).toContain('Emission');
    });

    it('applies priority filter', async () => {
      const filters = { priority: ['high' as const] };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].priority).toBe('high');
    });

    it('applies source filter', async () => {
      const filters = { source: ['EPA'] };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].source).toBe('EPA');
    });

    it('applies status filter', async () => {
      const filters = { status: ['analyzed'] };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].status).toBe('analyzed');
    });

    it('applies date range filter', async () => {
      const filters = {
        dateRange: {
          start: new Date('2024-12-01'),
          end: new Date('2025-01-31'),
        },
      };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(2);
      expect(result.regulations.every(r => 
        r.date >= filters.dateRange.start && r.date <= filters.dateRange.end
      )).toBe(true);
    });

    it('applies multiple filters simultaneously', async () => {
      const filters = {
        priority: ['high' as const, 'medium' as const],
        source: ['EPA', 'PHMSA'],
      };
      const result = await service.getRegulations(filters);

      expect(result.regulations).toHaveLength(2);
      expect(result.regulations.every(r => 
        ['high', 'medium'].includes(r.priority || 'low') &&
        ['EPA', 'PHMSA'].includes(r.source)
      )).toBe(true);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('sorts by date descending (default)', async () => {
      const result = await service.getRegulations({}, { sortBy: 'date', sortDirection: 'desc' });

      expect(result.regulations[0].date.getTime()).toBeGreaterThan(
        result.regulations[1].date.getTime()
      );
    });

    it('sorts by date ascending', async () => {
      const result = await service.getRegulations({}, { sortBy: 'date', sortDirection: 'asc' });

      expect(result.regulations[0].date.getTime()).toBeLessThan(
        result.regulations[1].date.getTime()
      );
    });

    it('sorts by risk score descending', async () => {
      const result = await service.getRegulations({}, { sortBy: 'riskScore', sortDirection: 'desc' });

      expect(result.regulations[0].riskScore).toBeGreaterThan(
        result.regulations[1].riskScore || 0
      );
    });

    it('sorts by title alphabetically', async () => {
      const result = await service.getRegulations({}, { sortBy: 'title', sortDirection: 'asc' });

      expect(result.regulations[0].title.localeCompare(result.regulations[1].title)).toBeLessThan(0);
    });

    it('sorts by source alphabetically', async () => {
      const result = await service.getRegulations({}, { sortBy: 'source', sortDirection: 'asc' });

      expect(result.regulations[0].source.localeCompare(result.regulations[1].source)).toBeLessThan(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('applies pagination correctly', async () => {
      const result = await service.getRegulations({}, { limit: 2, offset: 0 });

      expect(result.regulations).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('handles second page correctly', async () => {
      const result = await service.getRegulations({}, { limit: 2, offset: 2 });

      expect(result.regulations).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('Individual Regulation Operations', () => {
    it('retrieves single regulation by ID', async () => {
      mockStorage.getRegulation.mockResolvedValue(mockRegulations[0]);

      const result = await service.getRegulation('reg-001');

      expect(result).toEqual(mockRegulations[0]);
      expect(mockStorage.getRegulation).toHaveBeenCalledWith('reg-001');
    });

    it('returns null for non-existent regulation', async () => {
      mockStorage.getRegulation.mockResolvedValue(null);

      const result = await service.getRegulation('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Search Operations', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('searches regulations by text query', async () => {
      const result = await service.searchRegulations('emission');

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].title).toContain('Emission');
    });

    it('searches in full text content', async () => {
      const result = await service.searchRegulations('monitoring');

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].fullText).toContain('monitoring');
    });
  });

  describe('Specialized Queries', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('gets regulations by priority', async () => {
      const result = await service.getRegulationsByPriority('high');

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].priority).toBe('high');
    });

    it('gets regulations by source', async () => {
      const result = await service.getRegulationsBySource('EPA');

      expect(result.regulations).toHaveLength(1);
      expect(result.regulations[0].source).toBe('EPA');
    });

    it('gets recent regulations (last 30 days)', async () => {
      const result = await service.getRecentRegulations();

      // Only regulations from the last 30 days should be included
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      expect(result.regulations.every(r => r.date >= thirtyDaysAgo)).toBe(true);
    });

    it('gets high priority regulations', async () => {
      const result = await service.getHighPriorityRegulations();

      expect(result.regulations).toHaveLength(1);
      expect(['high', 'critical']).toContain(result.regulations[0].priority);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('calculates regulation statistics', async () => {
      const stats = await service.getRegulationStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus.analyzed).toBe(1);
      expect(stats.byStatus.reviewed).toBe(1);
      expect(stats.byStatus.new).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.bySource.EPA).toBe(1);
      expect(stats.bySource.PHMSA).toBe(1);
      expect(stats.bySource.DOE).toBe(1);
      expect(stats.averageRiskScore).toBeCloseTo(6.27, 2);
    });
  });

  describe('Filter Options', () => {
    beforeEach(() => {
      mockStorage.getAllRegulations.mockResolvedValue(mockRegulations);
    });

    it('gets available filter options', async () => {
      const options = await service.getFilterOptions();

      expect(options.sources).toEqual(['DOE', 'EPA', 'PHMSA']);
      expect(options.priorities).toEqual(['high', 'low', 'medium']);
      expect(options.statuses).toEqual(['analyzed', 'new', 'reviewed']);
    });
  });

  describe('Update Operations', () => {
    it('updates regulation status', async () => {
      const updatedRegulation = { ...mockRegulations[0], status: 'reviewed' as const };
      mockStorage.updateRegulation.mockResolvedValue(updatedRegulation);

      const result = await service.updateRegulationStatus('reg-001', 'reviewed');

      expect(result?.status).toBe('reviewed');
      expect(mockStorage.updateRegulation).toHaveBeenCalledWith('reg-001', { status: 'reviewed' });
    });

    it('assigns regulation to user', async () => {
      const updatedRegulation = { ...mockRegulations[0], assignedTo: 'john.doe' };
      mockStorage.updateRegulation.mockResolvedValue(updatedRegulation);

      const result = await service.assignRegulation('reg-001', 'john.doe');

      expect(result?.assignedTo).toBe('john.doe');
      expect(mockStorage.updateRegulation).toHaveBeenCalledWith('reg-001', { assignedTo: 'john.doe' });
    });

    it('marks regulation as reviewed', async () => {
      const updatedRegulation = { 
        ...mockRegulations[0], 
        status: 'reviewed' as const,
        reviewedAt: expect.any(Date),
      };
      mockStorage.updateRegulation.mockResolvedValue(updatedRegulation);

      const result = await service.markAsReviewed('reg-001');

      expect(result?.status).toBe('reviewed');
      expect(result?.reviewedAt).toBeInstanceOf(Date);
      expect(mockStorage.updateRegulation).toHaveBeenCalledWith('reg-001', {
        status: 'reviewed',
        reviewedAt: expect.any(Date),
      });
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', async () => {
      mockStorage.getAllRegulations.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.getRegulations()).rejects.toThrow('Failed to fetch regulations');
    });

    it('handles individual regulation fetch errors', async () => {
      mockStorage.getRegulation.mockRejectedValue(new Error('Redis error'));

      const result = await service.getRegulation('reg-001');

      expect(result).toBeNull();
    });

    it('handles statistics calculation errors', async () => {
      mockStorage.getAllRegulations.mockRejectedValue(new Error('Redis error'));

      await expect(service.getRegulationStats()).rejects.toThrow('Failed to fetch regulation statistics');
    });

    it('handles update operation errors', async () => {
      mockStorage.updateRegulation.mockRejectedValue(new Error('Update failed'));

      const result = await service.updateRegulationStatus('reg-001', 'reviewed');

      expect(result).toBeNull();
    });
  });
});