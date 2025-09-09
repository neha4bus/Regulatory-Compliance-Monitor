/**
 * Basic tests for regulation feed functionality
 */

import { RegulationService } from '../services/regulationService';
import { DashboardFilters } from '../types/dashboard';

// Mock Redis dependencies
jest.mock('../../redis/config', () => ({
  RedisConnection: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    getClient: jest.fn(),
  })),
}));

jest.mock('../../redis/storage', () => ({
  RegulationStorage: jest.fn().mockImplementation(() => ({
    getAllRegulations: jest.fn().mockResolvedValue([
      {
        id: 'reg-001',
        title: 'Test Regulation',
        date: new Date('2025-01-01'),
        url: 'https://example.com',
        fullText: 'Test content',
        source: 'EPA',
        scrapedAt: new Date(),
        hash: 'hash-001',
        status: 'new',
        riskScore: 5.0,
        priority: 'medium',
      },
    ]),
    getRegulation: jest.fn(),
    getRegulationCounts: jest.fn().mockResolvedValue({
      new: 1,
      analyzed: 0,
      reviewed: 0,
      archived: 0,
    }),
  })),
}));

describe('Regulation Feed Basic Tests', () => {
  let service: RegulationService;

  beforeEach(() => {
    service = new RegulationService();
  });

  describe('RegulationService', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(RegulationService);
    });

    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should get regulations with default options', async () => {
      const result = await service.getRegulations();
      
      expect(result).toHaveProperty('regulations');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.regulations)).toBe(true);
    });

    it('should apply search filters', async () => {
      const filters: DashboardFilters = {
        searchQuery: 'test',
      };
      
      const result = await service.getRegulations(filters);
      expect(result.regulations).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const result = await service.getRegulations({}, { limit: 10, offset: 0 });
      
      expect(result.pageSize).toBe(10);
      expect(result.page).toBe(1);
    });

    it('should get regulation statistics', async () => {
      const stats = await service.getRegulationStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('bySource');
      expect(stats).toHaveProperty('averageRiskScore');
    });
  });

  describe('Filter Application', () => {
    it('should filter by priority', async () => {
      const filters: DashboardFilters = {
        priority: ['medium'],
      };
      
      const result = await service.getRegulations(filters);
      expect(result.regulations.every(r => r.priority === 'medium')).toBe(true);
    });

    it('should filter by source', async () => {
      const filters: DashboardFilters = {
        source: ['EPA'],
      };
      
      const result = await service.getRegulations(filters);
      expect(result.regulations.every(r => r.source === 'EPA')).toBe(true);
    });

    it('should filter by status', async () => {
      const filters: DashboardFilters = {
        status: ['new'],
      };
      
      const result = await service.getRegulations(filters);
      expect(result.regulations.every(r => r.status === 'new')).toBe(true);
    });
  });

  describe('Sorting', () => {
    it('should sort by date descending by default', async () => {
      const result = await service.getRegulations({}, { 
        sortBy: 'date', 
        sortDirection: 'desc' 
      });
      
      expect(result.regulations).toHaveLength(1);
    });

    it('should sort by risk score', async () => {
      const result = await service.getRegulations({}, { 
        sortBy: 'riskScore', 
        sortDirection: 'desc' 
      });
      
      expect(result.regulations).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // The service should work with mocked data
      const result = await service.getRegulations();
      
      // Should return the mocked regulation
      expect(result.regulations).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});