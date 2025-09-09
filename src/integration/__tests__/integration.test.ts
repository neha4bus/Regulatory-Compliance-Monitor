/**
 * Integration Tests for Core Workflow
 * Tests the complete end-to-end flow from data collection to dashboard display
 */

import { IntegrationService, IntegrationOrchestrator, DemoScenarioGenerator } from '../index';
import { RedisService } from '../../components/redis';
import { QodoService } from '../../components/qodo';
import { Regulation } from '../../types';

// Mock external dependencies
jest.mock('../../components/redis', () => ({
  RedisService: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    storage: {
      saveRegulation: jest.fn().mockResolvedValue(undefined),
      getRegulation: jest.fn().mockResolvedValue(null),
      getAllRegulations: jest.fn().mockResolvedValue([]),
      isDuplicate: jest.fn().mockResolvedValue(null)
    },
    changeTracker: {
      recordChange: jest.fn().mockResolvedValue(undefined)
    }
  }))
}));

jest.mock('../../components/qodo', () => ({
  QodoService: jest.fn().mockImplementation(() => ({
    healthCheck: jest.fn().mockResolvedValue(true),
    analyzeRegulation: jest.fn().mockResolvedValue({
      summary: 'Test regulation summary',
      riskScore: 7.5,
      priority: 'high',
      insights: {
        whatChanged: 'New emission standards',
        whoImpacted: ['Offshore operators'],
        requiredActions: ['Install monitoring equipment', 'Update procedures']
      },
      complianceChecklist: ['Review current systems', 'Plan upgrades']
    })
  }))
}));

describe('Integration Service - End-to-End Workflow', () => {
  let integrationService: IntegrationService;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockQodoService: jest.Mocked<QodoService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create integration service
    integrationService = new IntegrationService({
      demoMode: true,
      enableRealTimeUpdates: true
    });

    // Get mock instances
    const { RedisService } = require('../../components/redis');
    const { QodoService } = require('../../components/qodo');
    
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockQodoService = new QodoService() as jest.Mocked<QodoService>;
  });

  afterEach(async () => {
    if (integrationService) {
      await integrationService.shutdown();
    }
  });

  describe('Service Initialization', () => {
    it('should initialize all components successfully', async () => {
      await integrationService.initialize();
      
      const status = await integrationService.getSystemStatus();
      expect(status.initialized).toBe(true);
      expect(status.orchestrator.overall).toBe(true);
    });

    it('should handle initialization failures gracefully', async () => {
      mockRedisService.connect.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(integrationService.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Demo Scenario Execution', () => {
    beforeEach(async () => {
      await integrationService.initialize();
    });

    it('should run hackathon demo scenario successfully', async () => {
      const scenario = DemoScenarioGenerator.getScenario('hackathon');
      expect(scenario.regulations).toHaveLength(5);
      expect(scenario.expectedOutcomes.highPriorityCount).toBe(3);

      await integrationService.runDemoScenario('hackathon');

      // Verify that regulations were processed
      expect(mockQodoService.analyzeRegulation).toHaveBeenCalledTimes(5);
      expect(mockRedisService.storage.saveRegulation).toHaveBeenCalled();
    });

    it('should run quick demo scenario successfully', async () => {
      const scenario = DemoScenarioGenerator.getScenario('quick');
      expect(scenario.regulations).toHaveLength(2);

      await integrationService.runDemoScenario('quick');

      expect(mockQodoService.analyzeRegulation).toHaveBeenCalledTimes(2);
    });

    it('should handle processing errors gracefully', async () => {
      mockQodoService.analyzeRegulation.mockRejectedValueOnce(new Error('AI analysis failed'));

      // Should not throw, but should log error
      await expect(integrationService.runDemoScenario('quick')).resolves.not.toThrow();
    });
  });

  describe('Data Processing Pipeline', () => {
    let orchestrator: IntegrationOrchestrator;

    beforeEach(async () => {
      orchestrator = new IntegrationOrchestrator({ demoMode: true });
      await orchestrator.initialize();
    });

    afterEach(async () => {
      await orchestrator.shutdown();
    });

    it('should process regulation through complete pipeline', async () => {
      const scrapedData = {
        id: 'test-001',
        title: 'Test Regulation',
        date: '2025-01-08',
        url: 'https://test.gov/regulation',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: 'This is a test regulation requiring immediate compliance.'
      };

      const regulation = await orchestrator.processRegulation(scrapedData);

      expect(regulation).toBeDefined();
      expect(regulation.id).toBe('test-001');
      expect(regulation.status).toBe('analyzed');
      expect(regulation.summary).toBe('Test regulation summary');
      expect(regulation.riskScore).toBe(7.5);
      expect(regulation.priority).toBe('high');
    });

    it('should detect and handle duplicate regulations', async () => {
      mockRedisService.storage.isDuplicate.mockResolvedValue('existing-id');

      const scrapedData = {
        id: 'duplicate-001',
        title: 'Duplicate Regulation',
        date: '2025-01-08',
        url: 'https://test.gov/duplicate',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: 'This is a duplicate regulation.'
      };

      const regulation = await orchestrator.processRegulation(scrapedData);
      
      // Should still return regulation but not process through AI
      expect(regulation).toBeDefined();
      expect(mockQodoService.analyzeRegulation).not.toHaveBeenCalled();
    });

    it('should track changes in Redis', async () => {
      const scrapedData = {
        id: 'tracked-001',
        title: 'Tracked Regulation',
        date: '2025-01-08',
        url: 'https://test.gov/tracked',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: 'This regulation will be tracked.'
      };

      await orchestrator.processRegulation(scrapedData);

      expect(mockRedisService.changeTracker.recordChange).toHaveBeenCalledWith(
        'tracked-001',
        'analyzed',
        expect.objectContaining({
          riskScore: 7.5,
          priority: 'high'
        })
      );
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      await integrationService.initialize();
    });

    it('should start real-time demo updates', async () => {
      mockRedisService.storage.getAllRegulations.mockResolvedValue([
        {
          id: 'reg-001',
          title: 'Test Regulation',
          priority: 'high',
          riskScore: 8.0
        } as Regulation
      ]);

      await integrationService.startRealTimeDemo();

      // Verify that demo updates were started
      const status = await integrationService.getSystemStatus();
      expect(status.realTimeUpdates.connectedClients).toBe(1);
    });

    it('should provide dashboard data', async () => {
      const mockRegulations: Regulation[] = [
        {
          id: 'reg-001',
          title: 'High Priority Regulation',
          priority: 'high',
          riskScore: 8.5,
          complianceChecklist: ['Action 1', 'Action 2']
        } as Regulation,
        {
          id: 'reg-002',
          title: 'Medium Priority Regulation',
          priority: 'medium',
          riskScore: 5.0,
          complianceChecklist: ['Action 3']
        } as Regulation
      ];

      mockRedisService.storage.getAllRegulations.mockResolvedValue(mockRegulations);

      const dashboardData = await integrationService.getDashboardData();

      expect(dashboardData.regulations).toHaveLength(2);
      expect(dashboardData.highPriorityCount).toBe(1);
      expect(dashboardData.totalActionItems).toBe(3);
      expect(dashboardData.systemStatus.overall).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection failures', async () => {
      mockRedisService.connect.mockRejectedValue(new Error('Redis unavailable'));

      await expect(integrationService.initialize()).rejects.toThrow('Redis unavailable');
    });

    it('should handle Qodo API failures', async () => {
      await integrationService.initialize();
      
      mockQodoService.analyzeRegulation.mockRejectedValue(new Error('Qodo API error'));

      const scrapedData = {
        id: 'error-test',
        title: 'Error Test Regulation',
        date: '2025-01-08',
        url: 'https://test.gov/error',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: 'This will cause an error.'
      };

      // Should handle error gracefully
      await expect(integrationService.runDemoScenario('quick')).resolves.not.toThrow();
    });

    it('should provide health check information', async () => {
      await integrationService.initialize();

      const status = await integrationService.getSystemStatus();

      expect(status).toHaveProperty('orchestrator');
      expect(status).toHaveProperty('realTimeUpdates');
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('timestamp');
    });
  });

  describe('System Shutdown', () => {
    it('should shutdown all components cleanly', async () => {
      await integrationService.initialize();
      await integrationService.shutdown();

      expect(mockRedisService.disconnect).toHaveBeenCalled();
      
      const status = await integrationService.getSystemStatus();
      expect(status.initialized).toBe(false);
    });
  });
});

describe('Demo Scenario Generator', () => {
  it('should generate hackathon demo scenario', () => {
    const scenario = DemoScenarioGenerator.generateHackathonDemo();

    expect(scenario.name).toContain('Hackathon Demo');
    expect(scenario.regulations).toHaveLength(5);
    expect(scenario.expectedOutcomes.highPriorityCount).toBe(3);
    expect(scenario.expectedOutcomes.affectedOperations).toContain('Offshore Drilling Platforms');
  });

  it('should generate quick demo scenario', () => {
    const scenario = DemoScenarioGenerator.generateQuickDemo();

    expect(scenario.name).toContain('Quick Demo');
    expect(scenario.regulations).toHaveLength(2);
    expect(scenario.expectedOutcomes.highPriorityCount).toBe(1);
  });

  it('should return correct scenario by name', () => {
    const hackathonScenario = DemoScenarioGenerator.getScenario('hackathon');
    const quickScenario = DemoScenarioGenerator.getScenario('quick');

    expect(hackathonScenario.regulations).toHaveLength(5);
    expect(quickScenario.regulations).toHaveLength(2);
  });
});