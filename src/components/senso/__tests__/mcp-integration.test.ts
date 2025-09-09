/**
 * Tests for Senso MCP Integration
 */

import { SensoMCPIntegration } from '../mcp-integration';
import { Regulation } from '../../../types/models';

describe('SensoMCPIntegration', () => {
  let sensoMCP: SensoMCPIntegration;
  let mockRegulation: Regulation;

  beforeEach(() => {
    sensoMCP = new SensoMCPIntegration({ enableMockMode: true });
    
    mockRegulation = {
      id: 'reg-001',
      title: 'Test Regulation',
      date: new Date('2025-01-08'),
      url: 'https://test.gov/reg-001',
      fullText: 'Test regulation content requiring immediate compliance',
      source: 'EPA',
      scrapedAt: new Date(),
      hash: 'test-hash',
      status: 'new',
      priority: 'high',
      riskScore: 8.5
    };
  });

  describe('executeRegulatoryProcessing', () => {
    it('should execute regulatory processing workflow successfully', async () => {
      const result = await sensoMCP.executeRegulatoryProcessing(mockRegulation);

      expect(result).toBeDefined();
      expect(result.workflowId).toContain('mock_regulatory_processing');
      expect(result.status).toBe('completed');
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.steps).toHaveLength(3);
      expect(result.output).toBeDefined();
      expect(result.output.regulationProcessed).toBe(mockRegulation.id);
    });

    it('should include all expected workflow steps', async () => {
      const result = await sensoMCP.executeRegulatoryProcessing(mockRegulation);

      const stepNames = result.steps.map(step => step.name);
      expect(stepNames).toContain('validate_data');
      expect(stepNames).toContain('ai_analysis');
      expect(stepNames).toContain('slack_notification');

      // All steps should be completed in mock mode
      result.steps.forEach(step => {
        expect(step.status).toBe('completed');
        expect(step.startedAt).toBeInstanceOf(Date);
        expect(step.completedAt).toBeInstanceOf(Date);
        expect(step.duration).toBeGreaterThan(0);
        expect(step.output).toBeDefined();
      });
    });

    it('should handle workflow execution timing correctly', async () => {
      const startTime = Date.now();
      const result = await sensoMCP.executeRegulatoryProcessing(mockRegulation);
      const endTime = Date.now();

      expect(result.startedAt.getTime()).toBeGreaterThanOrEqual(startTime - 1000);
      expect(result.completedAt!.getTime()).toBeLessThanOrEqual(endTime + 1000);
      
      // Workflow should take some time to execute
      const executionTime = result.completedAt!.getTime() - result.startedAt.getTime();
      expect(executionTime).toBeGreaterThan(1000); // At least 1 second
    });
  });

  describe('executeEmergencyRegulationHandler', () => {
    it('should execute emergency workflow with faster processing', async () => {
      const result = await sensoMCP.executeEmergencyRegulationHandler(mockRegulation);

      expect(result).toBeDefined();
      expect(result.workflowId).toContain('mock_emergency_regulation_handler');
      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(3);
      
      // Emergency workflows should complete faster
      const executionTime = result.completedAt!.getTime() - result.startedAt.getTime();
      expect(executionTime).toBeLessThan(10000); // Less than 10 seconds
    });

    it('should handle emergency regulation priority correctly', async () => {
      const emergencyRegulation = {
        ...mockRegulation,
        priority: 'critical' as const,
        title: 'EMERGENCY: Critical Safety Regulation'
      };

      const result = await sensoMCP.executeEmergencyRegulationHandler(emergencyRegulation);

      expect(result.status).toBe('completed');
      expect(result.output.regulationProcessed).toBe(emergencyRegulation.id);
    });
  });

  describe('executeComplianceReminder', () => {
    it('should execute compliance reminder workflow', async () => {
      const result = await sensoMCP.executeComplianceReminder();

      expect(result).toBeDefined();
      expect(result.workflowId).toContain('mock_compliance_reminder');
      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(3);
    });

    it('should complete reminder workflow without input data', async () => {
      const result = await sensoMCP.executeComplianceReminder();

      expect(result.status).toBe('completed');
      expect(result.steps.every(step => step.status === 'completed')).toBe(true);
    });
  });

  describe('executeSystemHealthCheck', () => {
    it('should execute system health check workflow', async () => {
      const result = await sensoMCP.executeSystemHealthCheck();

      expect(result).toBeDefined();
      expect(result.workflowId).toContain('mock_system_health_check');
      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(3);
    });

    it('should always complete health check workflow', async () => {
      const result = await sensoMCP.executeSystemHealthCheck();

      // Health checks should always complete, even if individual checks fail
      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return workflow status for existing workflow', async () => {
      const workflowId = 'test-workflow-123';
      const status = await sensoMCP.getWorkflowStatus(workflowId);

      expect(status).toBeDefined();
      expect(status!.workflowId).toBe(workflowId);
      expect(status!.status).toBe('completed');
      expect(status!.steps).toHaveLength(1);
    });

    it('should return workflow with timing information', async () => {
      const status = await sensoMCP.getWorkflowStatus('test-workflow');

      expect(status!.startedAt).toBeInstanceOf(Date);
      expect(status!.completedAt).toBeInstanceOf(Date);
      expect(status!.steps[0].duration).toBeGreaterThan(0);
    });
  });

  describe('listActiveWorkflows', () => {
    it('should return list of active workflows', async () => {
      const workflows = await sensoMCP.listActiveWorkflows();

      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
      
      workflows.forEach(workflow => {
        expect(workflow.workflowId).toBeDefined();
        expect(workflow.status).toBeDefined();
        expect(workflow.startedAt).toBeInstanceOf(Date);
      });
    });

    it('should include both running and completed workflows', async () => {
      const workflows = await sensoMCP.listActiveWorkflows();

      const statuses = workflows.map(w => w.status);
      expect(statuses).toContain('running');
      expect(statuses).toContain('completed');
    });
  });

  describe('cancelWorkflow', () => {
    it('should cancel workflow successfully in mock mode', async () => {
      const result = await sensoMCP.cancelWorkflow('test-workflow-123');

      expect(result).toBe(true);
    });

    it('should handle workflow cancellation', async () => {
      const workflowId = 'workflow-to-cancel';
      const cancelled = await sensoMCP.cancelWorkflow(workflowId);

      expect(typeof cancelled).toBe('boolean');
      expect(cancelled).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should test MCP connection successfully', async () => {
      const result = await sensoMCP.testConnection();

      expect(result.success).toBe(true);
      expect(result.version).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return version information', async () => {
      const result = await sensoMCP.testConnection();

      expect(result.version).toBe('mock-1.0.0');
    });
  });

  describe('getWorkflowStats', () => {
    it('should return workflow statistics', async () => {
      const stats = await sensoMCP.getWorkflowStats();

      expect(stats).toBeDefined();
      expect(stats.totalExecutions).toBeGreaterThan(0);
      expect(stats.successfulExecutions).toBeGreaterThan(0);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.workflowTypes).toBeDefined();
    });

    it('should include workflow type breakdown', async () => {
      const stats = await sensoMCP.getWorkflowStats();

      expect(stats.workflowTypes.regulatory_processing).toBeGreaterThan(0);
      expect(stats.workflowTypes.emergency_regulation_handler).toBeGreaterThan(0);
      expect(stats.workflowTypes.compliance_reminder).toBeGreaterThan(0);
      expect(stats.workflowTypes.system_health_check).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      const stats = await sensoMCP.getWorkflowStats();

      const successRate = stats.successfulExecutions / stats.totalExecutions;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(successRate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('error handling', () => {
    it('should handle workflow execution errors gracefully', async () => {
      // Test with invalid regulation data
      const invalidRegulation = { ...mockRegulation, id: '' };

      const result = await sensoMCP.executeRegulatoryProcessing(invalidRegulation);

      // Should still return a result, even if some steps fail
      expect(result).toBeDefined();
      expect(result.workflowId).toBeDefined();
    });

    it('should handle connection errors in non-mock mode', async () => {
      const nonMockSenso = new SensoMCPIntegration({ enableMockMode: false });

      const connectionResult = await nonMockSenso.testConnection();
      
      // In non-mock mode without actual MCP server, should still handle gracefully
      expect(connectionResult).toBeDefined();
      expect(typeof connectionResult.success).toBe('boolean');
    });
  });

  describe('workflow step execution', () => {
    it('should generate appropriate step outputs', async () => {
      const result = await sensoMCP.executeRegulatoryProcessing(mockRegulation);

      const validationStep = result.steps.find(s => s.name === 'validate_data');
      expect(validationStep?.output).toHaveProperty('valid');

      const analysisStep = result.steps.find(s => s.name === 'ai_analysis');
      expect(analysisStep?.output).toHaveProperty('riskScore');
      expect(analysisStep?.output).toHaveProperty('priority');

      const notificationStep = result.steps.find(s => s.name === 'slack_notification');
      expect(notificationStep?.output).toHaveProperty('sent');
      expect(notificationStep?.output).toHaveProperty('channel');
    });

    it('should track step execution timing', async () => {
      const result = await sensoMCP.executeRegulatoryProcessing(mockRegulation);

      result.steps.forEach(step => {
        expect(step.startedAt).toBeInstanceOf(Date);
        expect(step.completedAt).toBeInstanceOf(Date);
        expect(step.duration).toBeGreaterThan(0);
        expect(step.completedAt!.getTime()).toBeGreaterThanOrEqual(step.startedAt!.getTime());
      });
    });
  });
});