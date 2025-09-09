/**
 * Integration tests for Qodo AI Analysis system
 */

import { QodoService } from '../index';

describe('Qodo Integration Tests', () => {
  let qodoService: QodoService;

  beforeEach(() => {
    qodoService = new QodoService();
  });

  describe('end-to-end analysis', () => {
    it('should perform complete analysis on realistic regulatory text', async () => {
      const regulatoryText = `
        URGENT: New Emission Monitoring Requirements for Offshore Drilling Operations
        
        Effective immediately, all offshore drilling operators must implement enhanced emission monitoring systems.
        
        Key Requirements:
        - Install certified continuous emission monitoring equipment within 90 days
        - Train all personnel on new monitoring procedures within 60 days
        - Submit monthly emission reports to EPA starting March 1, 2025
        - Maintain 24/7 monitoring of methane, CO2, and NOx emissions
        - Implement immediate shutdown procedures if emission thresholds are exceeded
        
        Compliance Deadlines:
        - Equipment installation: 90 days from publication
        - Personnel training: 60 days from publication
        - First report submission: March 1, 2025
        
        Penalties for non-compliance include fines up to $100,000 per day and potential facility shutdown.
        
        This regulation affects all offshore drilling operations in federal waters, including:
        - Fixed platforms
        - Floating production systems
        - Mobile offshore drilling units
        - Subsea production systems
        
        Operators must also establish emergency response procedures and maintain detailed documentation
        of all monitoring activities for inspection purposes.
      `;

      const title = 'Emergency Emission Monitoring Requirements - Offshore Operations';

      const result = await qodoService.analyzeRegulation(regulatoryText, title);

      // Verify comprehensive analysis results
      expect(result).toBeDefined();
      expect(result.regulation).toBeDefined();
      expect(result.qodoResponse).toBeDefined();
      expect(result.priorityMetrics).toBeDefined();
      expect(result.extractedInsights).toBeDefined();
      expect(result.complianceChecklist).toBeDefined();

      // Verify regulation object
      expect(result.regulation.title).toBe(title);
      expect(result.regulation.fullText).toBe(regulatoryText);
      expect(result.regulation.status).toBe('analyzed');
      expect(result.regulation.summary).toBeTruthy();

      // Verify risk assessment
      expect(result.priorityMetrics.riskScore).toBeGreaterThan(6); // Should be high risk
      expect(result.priorityMetrics.priority).toMatch(/^(high|critical)$/);
      expect(result.priorityMetrics.urgencyLevel).toBeGreaterThan(5);
      expect(result.priorityMetrics.impactLevel).toBeGreaterThan(5);

      // Verify insights extraction
      expect(result.extractedInsights.whatChanged).toContain('emission');
      expect(result.extractedInsights.whoImpacted).toContain('Offshore operations');
      expect(result.extractedInsights.requiredActions.length).toBeGreaterThan(3);
      expect(result.extractedInsights.keyDeadlines.length).toBeGreaterThan(0);
      expect(result.extractedInsights.affectedAreas).toContain('Offshore');
      expect(result.extractedInsights.complianceLevel).toMatch(/^(low|medium|high|critical)$/);

      // Verify compliance checklist
      expect(result.complianceChecklist.totalItems).toBeGreaterThan(5);
      expect(result.complianceChecklist.categories).toContain('emission');
      expect(result.complianceChecklist.estimatedTotalHours).toBeGreaterThan(20);
      
      const highPriorityItems = result.complianceChecklist.items.filter(
        (item: any) => item.priority === 'high' || item.priority === 'critical'
      );
      expect(highPriorityItems.length).toBeGreaterThan(0);

      // Verify processing metrics
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(5);
      expect(result.errors).toBeInstanceOf(Array);

      console.log('Integration test results:', {
        riskScore: result.priorityMetrics.riskScore,
        priority: result.priorityMetrics.priority,
        checklistItems: result.complianceChecklist.totalItems,
        processingTime: result.processingTime,
        confidence: result.confidence,
        errors: result.errors.length,
      });
    }, 30000); // 30 second timeout for integration test

    it('should handle safety-focused regulatory text', async () => {
      const safetyText = `
        Updated Safety Protocols for Onshore Production Facilities
        
        All onshore oil and gas production facilities must implement the following safety measures:
        
        1. Conduct comprehensive safety risk assessments annually
        2. Install gas detection systems at all wellheads and processing equipment
        3. Establish 500-foot safety zones around high-pressure equipment
        4. Train all personnel in emergency response procedures
        5. Maintain emergency shutdown systems with automatic activation
        
        These requirements are mandatory for all operators and must be implemented
        within 120 days of this notice.
      `;

      const result = await qodoService.analyzeRegulation(safetyText);

      expect(result.extractedInsights.affectedAreas).toContain('Production');
      expect(result.complianceChecklist.categories).toContain('safety');
      expect(result.extractedInsights.complianceLevel).toMatch(/^(medium|high|critical)$/);
      
      const safetyItems = result.complianceChecklist.items.filter(
        (item: any) => item.category === 'safety'
      );
      expect(safetyItems.length).toBeGreaterThan(0);
    });

    it('should handle reporting-focused regulatory text', async () => {
      const reportingText = `
        New Quarterly Reporting Requirements for Pipeline Operators
        
        Beginning January 1, 2025, all interstate pipeline operators must submit
        quarterly operational reports including:
        - Incident reports and safety metrics
        - Environmental compliance data
        - Maintenance and inspection records
        - Personnel training completion status
        
        Reports must be submitted within 30 days of quarter end using the new
        electronic reporting system. Failure to submit timely reports may result
        in penalties and increased inspection frequency.
      `;

      const result = await qodoService.analyzeRegulation(reportingText);

      expect(result.extractedInsights.affectedAreas).toContain('Pipeline');
      expect(result.complianceChecklist.categories).toContain('reporting');
      expect(result.extractedInsights.keyDeadlines.some(
        (deadline: string) => deadline.includes('30 days')
      )).toBe(true);
    });
  });

  describe('service health and configuration', () => {
    it('should perform health check', async () => {
      const isHealthy = await qodoService.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });

    it('should have all required components initialized', () => {
      expect(qodoService.riskScorer).toBeDefined();
      expect(qodoService.insightExtractor).toBeDefined();
      expect(qodoService.checklistGenerator).toBeDefined();
      expect(qodoService.pipeline).toBeDefined();
    });
  });

  describe('error handling and resilience', () => {
    it('should handle empty text gracefully', async () => {
      const result = await qodoService.analyzeRegulation('');

      expect(result).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle very short text', async () => {
      const result = await qodoService.analyzeRegulation('New rule.');

      expect(result).toBeDefined();
      expect(result.regulation.fullText).toBe('New rule.');
      expect(result.complianceChecklist.items.length).toBeGreaterThan(0);
    });

    it('should handle text without clear regulatory patterns', async () => {
      const nonRegulatoryText = `
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco.
      `;

      const result = await qodoService.analyzeRegulation(nonRegulatoryText);

      expect(result).toBeDefined();
      expect(result.priorityMetrics.priority).toMatch(/^(low|medium|high|critical)$/);
      expect(result.complianceChecklist.items.length).toBeGreaterThan(0);
    });
  });

  describe('performance characteristics', () => {
    it('should complete analysis within reasonable time', async () => {
      const text = 'Standard regulatory requirements for oil and gas operations.';
      const startTime = Date.now();
      
      const result = await qodoService.analyzeRegulation(text);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(processingTime + 1000); // Should be reasonably accurate
    });

    it('should maintain consistent results for identical input', async () => {
      const text = 'Emission monitoring requirements for offshore operations.';
      
      const result1 = await qodoService.analyzeRegulation(text);
      const result2 = await qodoService.analyzeRegulation(text);

      // Results should be consistent (allowing for minor variations in mock data)
      expect(result1.priorityMetrics.priority).toBe(result2.priorityMetrics.priority);
      expect(result1.complianceChecklist.categories).toEqual(result2.complianceChecklist.categories);
      expect(Math.abs(result1.priorityMetrics.riskScore - result2.priorityMetrics.riskScore)).toBeLessThan(1);
    });
  });
});