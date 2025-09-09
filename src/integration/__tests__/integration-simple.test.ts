/**
 * Simple Integration Tests for Core Workflow
 * Tests the integration components without complex mocking
 */

import { DemoScenarioGenerator, RealTimeUpdateManager } from '../index';
import { Regulation } from '../../types';

describe('Integration Components - Simple Tests', () => {
  describe('Demo Scenario Generator', () => {
    it('should generate hackathon demo scenario with correct structure', () => {
      const scenario = DemoScenarioGenerator.generateHackathonDemo();

      expect(scenario).toBeDefined();
      expect(scenario.name).toContain('Hackathon Demo');
      expect(scenario.description).toBeDefined();
      expect(scenario.regulations).toHaveLength(5);
      expect(scenario.expectedOutcomes).toBeDefined();
      expect(scenario.expectedOutcomes.highPriorityCount).toBe(3);
      expect(scenario.expectedOutcomes.totalActionItems).toBe(25);
      expect(scenario.expectedOutcomes.affectedOperations).toContain('Offshore Drilling Platforms');
    });

    it('should generate quick demo scenario with correct structure', () => {
      const scenario = DemoScenarioGenerator.generateQuickDemo();

      expect(scenario).toBeDefined();
      expect(scenario.name).toContain('Quick Demo');
      expect(scenario.regulations).toHaveLength(2);
      expect(scenario.expectedOutcomes.highPriorityCount).toBe(1);
      expect(scenario.expectedOutcomes.totalActionItems).toBe(6);
    });

    it('should return correct scenario by name', () => {
      const hackathonScenario = DemoScenarioGenerator.getScenario('hackathon');
      const quickScenario = DemoScenarioGenerator.getScenario('quick');

      expect(hackathonScenario.regulations).toHaveLength(5);
      expect(quickScenario.regulations).toHaveLength(2);
    });

    it('should generate realistic regulatory data', () => {
      const scenario = DemoScenarioGenerator.generateHackathonDemo();
      const regulation = scenario.regulations[0];

      expect(regulation.id).toBeDefined();
      expect(regulation.title).toBeDefined();
      expect(regulation.date).toBeDefined();
      expect(regulation.url).toBeDefined();
      expect(regulation.source).toBeDefined();
      expect(regulation.fullText).toBeDefined();
      expect(regulation.scrapedAt).toBeDefined();

      // Check that full text contains realistic regulatory content
      expect(regulation.fullText).toContain('ENVIRONMENTAL PROTECTION AGENCY');
      expect(regulation.fullText).toContain('EFFECTIVE DATE');
      expect(regulation.fullText).toContain('REQUIREMENTS');
    });
  });

  describe('Real-time Update Manager', () => {
    let updateManager: RealTimeUpdateManager;

    beforeEach(() => {
      updateManager = new RealTimeUpdateManager();
    });

    afterEach(() => {
      updateManager.shutdown();
    });

    it('should initialize correctly', () => {
      expect(updateManager).toBeDefined();
      
      const stats = updateManager.getUpdateStats();
      expect(stats.connectedClients).toBe(0);
      expect(stats.queuedUpdates).toBe(0);
      expect(stats.isProcessing).toBe(false);
    });

    it('should register and unregister clients', () => {
      updateManager.registerClient('test-client-1');
      updateManager.registerClient('test-client-2');

      let stats = updateManager.getUpdateStats();
      expect(stats.connectedClients).toBe(2);

      updateManager.unregisterClient('test-client-1');
      stats = updateManager.getUpdateStats();
      expect(stats.connectedClients).toBe(1);
    });

    it('should create dashboard notifications', () => {
      const mockRegulation: Regulation = {
        id: 'test-001',
        title: 'Test Regulation',
        date: new Date(),
        url: 'https://test.gov/regulation',
        fullText: 'Test regulation content',
        source: 'EPA',
        scrapedAt: new Date(),
        hash: 'test-hash',
        status: 'analyzed',
        riskScore: 8.5,
        priority: 'high'
      };

      const notification = updateManager.createDashboardNotification(mockRegulation);

      expect(notification).toBeDefined();
      expect(notification.id).toContain('notification_test-001');
      expect(notification.title).toBe('New Regulation Processed');
      expect(notification.type).toBe('alert'); // High priority should be alert
      expect(notification.regulation.id).toBe('test-001');
      expect(notification.actions).toHaveLength(2);
    });

    it('should generate dashboard state correctly', async () => {
      const mockRegulations: Regulation[] = [
        {
          id: 'reg-001',
          title: 'High Priority Regulation',
          priority: 'high',
          riskScore: 8.5,
          complianceChecklist: ['Action 1', 'Action 2'],
          date: new Date(),
          url: 'https://test.gov/reg1',
          fullText: 'Test content',
          source: 'EPA',
          scrapedAt: new Date(),
          hash: 'hash1',
          status: 'analyzed'
        },
        {
          id: 'reg-002',
          title: 'Medium Priority Regulation',
          priority: 'medium',
          riskScore: 5.0,
          complianceChecklist: ['Action 3'],
          date: new Date(),
          url: 'https://test.gov/reg2',
          fullText: 'Test content',
          source: 'DOE',
          scrapedAt: new Date(),
          hash: 'hash2',
          status: 'analyzed'
        }
      ];

      const dashboardState = await updateManager.getCurrentDashboardState(mockRegulations);

      expect(dashboardState.regulations).toHaveLength(2);
      expect(dashboardState.highPriorityCount).toBe(1);
      expect(dashboardState.totalActionItems).toBe(3);
      expect(dashboardState.systemStatus.overall).toBe(true);
    });

    it('should clear queue correctly', () => {
      // Simulate some queued updates
      updateManager.emit('regulation_processed', { id: 'test' } as Regulation);
      
      updateManager.clearQueue();
      
      const stats = updateManager.getUpdateStats();
      expect(stats.queuedUpdates).toBe(0);
    });
  });

  describe('Integration Data Flow', () => {
    it('should process demo scenario data correctly', () => {
      const scenario = DemoScenarioGenerator.generateHackathonDemo();
      
      // Verify that each regulation has the required fields for processing
      scenario.regulations.forEach(regulation => {
        expect(regulation.id).toBeDefined();
        expect(regulation.title).toBeDefined();
        expect(regulation.fullText).toBeDefined();
        expect(regulation.source).toBeDefined();
        expect(regulation.date).toBeDefined();
        expect(regulation.url).toBeDefined();
        
        // Verify realistic content
        expect(regulation.fullText.length).toBeGreaterThan(100);
        expect(['EPA', 'DOE', 'Texas Railroad Commission', 'BOEM', 'OSHA']).toContain(regulation.source);
      });
    });

    it('should have consistent data structure across components', () => {
      const scenario = DemoScenarioGenerator.generateHackathonDemo();
      const updateManager = new RealTimeUpdateManager();
      
      // Test that scraped data can be converted to regulation format
      const scrapedData = scenario.regulations[0];
      
      const mockRegulation: Regulation = {
        id: scrapedData.id,
        title: scrapedData.title,
        date: new Date(scrapedData.date),
        url: scrapedData.url,
        fullText: scrapedData.fullText,
        source: scrapedData.source,
        scrapedAt: new Date(scrapedData.scrapedAt),
        hash: 'test-hash',
        status: 'new'
      };

      // Should be able to create notification
      const notification = updateManager.createDashboardNotification(mockRegulation);
      expect(notification).toBeDefined();
      
      updateManager.shutdown();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid scenario names gracefully', () => {
      const scenario = DemoScenarioGenerator.getScenario('invalid' as any);
      
      // Should default to quick scenario
      expect(scenario.regulations).toHaveLength(2);
      expect(scenario.name).toContain('Quick Demo');
    });

    it('should handle empty regulation lists', async () => {
      const updateManager = new RealTimeUpdateManager();
      
      const dashboardState = await updateManager.getCurrentDashboardState([]);
      
      expect(dashboardState.regulations).toHaveLength(0);
      expect(dashboardState.highPriorityCount).toBe(0);
      expect(dashboardState.totalActionItems).toBe(0);
      
      updateManager.shutdown();
    });
  });
});