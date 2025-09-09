/**
 * Unit tests for Risk Scoring and Priority Assignment
 */

import { RiskScorer, PriorityAssigner } from '../risk-scoring';

describe('RiskScorer', () => {
  let riskScorer: RiskScorer;

  beforeEach(() => {
    riskScorer = new RiskScorer();
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score for basic text', () => {
      const text = 'This is a basic regulatory requirement for oil and gas operations.';
      const result = riskScorer.calculateRiskScore(text);

      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.riskScore).toBeLessThanOrEqual(10);
      expect(result.priority).toMatch(/^(low|medium|high|critical)$/);
      expect(result.urgencyLevel).toBeGreaterThanOrEqual(0);
      expect(result.impactLevel).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    it('should assign higher risk scores to urgent content', () => {
      const urgentText = 'IMMEDIATE compliance required. Deadline is tomorrow. Violation will result in penalties.';
      const normalText = 'Standard regulatory requirements for operations.';

      const urgentResult = riskScorer.calculateRiskScore(urgentText);
      const normalResult = riskScorer.calculateRiskScore(normalText);

      expect(urgentResult.riskScore).toBeGreaterThan(normalResult.riskScore);
      expect(urgentResult.urgencyLevel).toBeGreaterThan(normalResult.urgencyLevel);
    });

    it('should assign higher risk scores to penalty-related content', () => {
      const penaltyText = 'Violations will result in fines up to $100,000 and potential facility shutdown.';
      const normalText = 'Standard operating procedures should be followed.';

      const penaltyResult = riskScorer.calculateRiskScore(penaltyText);
      const normalResult = riskScorer.calculateRiskScore(normalText);

      expect(penaltyResult.riskScore).toBeGreaterThan(normalResult.riskScore);
    });

    it('should consider industry impact in scoring', () => {
      const industryWideText = 'All offshore drilling operations nationwide must comply with new industry-wide standards.';
      const limitedText = 'Small facility operators should review procedures.';

      const industryResult = riskScorer.calculateRiskScore(industryWideText);
      const limitedResult = riskScorer.calculateRiskScore(limitedText);

      expect(industryResult.impactLevel).toBeGreaterThan(limitedResult.impactLevel);
    });

    it('should handle complex regulatory text', () => {
      const complexText = `
        New mandatory emission monitoring requirements for all offshore drilling operations.
        Operators must install certified monitoring equipment within 90 days.
        Failure to comply will result in penalties up to $500,000 and potential license revocation.
        All personnel must complete training and certification programs.
        Reporting requirements include monthly submissions to EPA.
      `;

      const result = riskScorer.calculateRiskScore(complexText);

      expect(result.riskScore).toBeGreaterThan(3);
      expect(result.priority).toMatch(/^(low|medium|high|critical)$/);
      expect(result.urgencyLevel).toBeGreaterThan(0);
      expect(result.impactLevel).toBeGreaterThan(0);
    });

    it('should include title in analysis when provided', () => {
      const text = 'Standard regulatory text.';
      const urgentTitle = 'URGENT: Immediate Compliance Required';

      const withTitleResult = riskScorer.calculateRiskScore(text, urgentTitle);
      const withoutTitleResult = riskScorer.calculateRiskScore(text);

      expect(withTitleResult.riskScore).toBeGreaterThan(withoutTitleResult.riskScore);
    });
  });

  describe('priority determination', () => {
    it('should correctly map risk scores to priorities', () => {
      const testCases = [
        { score: 9.0, expected: 'critical' },
        { score: 8.5, expected: 'critical' },
        { score: 7.0, expected: 'high' },
        { score: 6.5, expected: 'high' },
        { score: 5.0, expected: 'medium' },
        { score: 4.0, expected: 'medium' },
        { score: 3.0, expected: 'low' },
        { score: 1.0, expected: 'low' },
      ];

      testCases.forEach(({ score, expected }) => {
        const priority = riskScorer['determinePriority'](score);
        expect(priority).toBe(expected);
      });
    });
  });

  describe('content complexity assessment', () => {
    it('should assess complexity based on text characteristics', () => {
      const simpleText = 'Simple rule.';
      const complexText = 'This comprehensive regulation establishes detailed requirements for environmental monitoring, safety protocols, emission standards, and compliance reporting procedures for all offshore petroleum extraction operations, including specific technical specifications for monitoring equipment, personnel certification requirements, and mandatory reporting schedules.';

      const simpleComplexity = riskScorer['assessContentComplexity'](simpleText);
      const complexComplexity = riskScorer['assessContentComplexity'](complexText);

      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });
  });
});

describe('PriorityAssigner', () => {
  let priorityAssigner: PriorityAssigner;

  beforeEach(() => {
    priorityAssigner = new PriorityAssigner();
  });

  describe('assignPriority', () => {
    it('should assign priority with basic text', () => {
      const text = 'Standard regulatory requirements for oil and gas operations.';
      const result = priorityAssigner.assignPriority(text);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.priority).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should adjust priority based on metadata', () => {
      const text = 'Standard regulatory requirements.';
      const epaMetadata = { source: 'EPA', date: new Date().toISOString() };
      const otherMetadata = { source: 'Other', date: '2020-01-01' };

      const epaResult = priorityAssigner.assignPriority(text, undefined, epaMetadata);
      const otherResult = priorityAssigner.assignPriority(text, undefined, otherMetadata);

      expect(epaResult.riskScore).toBeGreaterThan(otherResult.riskScore);
    });

    it('should boost priority for recent regulations', () => {
      const text = 'Standard regulatory requirements.';
      const recentDate = new Date();
      const oldDate = new Date('2020-01-01');

      const recentResult = priorityAssigner.assignPriority(text, undefined, { date: recentDate.toISOString() });
      const oldResult = priorityAssigner.assignPriority(text, undefined, { date: oldDate.toISOString() });

      expect(recentResult.riskScore).toBeGreaterThan(oldResult.riskScore);
    });
  });

  describe('metadata adjustments', () => {
    it('should handle missing metadata gracefully', () => {
      const text = 'Standard regulatory requirements.';
      const result = priorityAssigner.assignPriority(text);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should adjust for authoritative sources', () => {
      const baseScore = 5.0;
      const epaAdjusted = priorityAssigner['adjustForMetadata'](baseScore, { source: 'EPA' });
      const doeAdjusted = priorityAssigner['adjustForMetadata'](baseScore, { source: 'DOE' });
      const otherAdjusted = priorityAssigner['adjustForMetadata'](baseScore, { source: 'Other' });

      expect(epaAdjusted).toBeGreaterThan(baseScore);
      expect(doeAdjusted).toBeGreaterThan(baseScore);
      expect(otherAdjusted).toBe(baseScore);
    });
  });
});