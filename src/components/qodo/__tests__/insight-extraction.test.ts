/**
 * Unit tests for Insight Extraction
 */

import { InsightExtractor } from '../insight-extraction';

describe('InsightExtractor', () => {
  let extractor: InsightExtractor;

  beforeEach(() => {
    extractor = new InsightExtractor();
  });

  describe('extractInsights', () => {
    it('should extract basic insights from regulatory text', () => {
      const text = 'New emission monitoring requirements for all offshore drilling operations. Operators must install equipment within 90 days.';
      const result = extractor.extractInsights(text);

      expect(result).toBeDefined();
      expect(result.whatChanged).toBeTruthy();
      expect(result.whoImpacted).toBeInstanceOf(Array);
      expect(result.requiredActions).toBeInstanceOf(Array);
      expect(result.keyDeadlines).toBeInstanceOf(Array);
      expect(result.affectedAreas).toBeInstanceOf(Array);
      expect(result.complianceLevel).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should extract what changed from explicit change statements', () => {
      const text = 'This regulation introduces new safety protocols for offshore operations. Updated requirements include mandatory training.';
      const result = extractor.extractInsights(text);

      expect(result.whatChanged).toContain('new safety protocols');
    });

    it('should identify impacted entities', () => {
      const text = 'All offshore operators and drilling companies must comply with new standards. Personnel and contractors are also affected.';
      const result = extractor.extractInsights(text);

      expect(result.whoImpacted.some(entity => entity.toLowerCase().includes('offshore'))).toBe(true);
      expect(result.whoImpacted).toContain('Personnel');
      expect(result.whoImpacted).toContain('Contractors');
    });

    it('should extract required actions', () => {
      const text = 'Operators must install monitoring equipment, train personnel, and submit monthly reports to EPA.';
      const result = extractor.extractInsights(text);

      expect(result.requiredActions.length).toBeGreaterThan(0);
      expect(result.requiredActions.some(action => action.toLowerCase().includes('install'))).toBe(true);
      expect(result.requiredActions.some(action => action.toLowerCase().includes('train'))).toBe(true);
    });

    it('should extract key deadlines', () => {
      const text = 'Compliance required by December 31, 2025. Equipment installation must be completed within 90 days.';
      const result = extractor.extractInsights(text);

      expect(result.keyDeadlines.length).toBeGreaterThan(0);
      expect(result.keyDeadlines.some(deadline => deadline.includes('December 31, 2025'))).toBe(true);
      expect(result.keyDeadlines.some(deadline => deadline.includes('90 days'))).toBe(true);
    });

    it('should identify affected operational areas', () => {
      const text = 'New requirements affect drilling, production, and transportation operations. Offshore platforms and pipelines must comply.';
      const result = extractor.extractInsights(text);

      expect(result.affectedAreas).toContain('Drilling');
      expect(result.affectedAreas).toContain('Production');
      expect(result.affectedAreas).toContain('Transportation');
      expect(result.affectedAreas).toContain('Offshore');
      expect(result.affectedAreas).toContain('Pipeline');
    });

    it('should assess compliance level correctly', () => {
      const criticalText = 'MANDATORY immediate compliance required. Violations result in penalties and enforcement action.';
      const lowText = 'Operators should consider updating procedures when convenient.';

      const criticalResult = extractor.extractInsights(criticalText);
      const lowResult = extractor.extractInsights(lowText);

      expect(criticalResult.complianceLevel).toMatch(/^(high|critical)$/);
      expect(lowResult.complianceLevel).toMatch(/^(low|medium)$/);
    });

    it('should handle text with title', () => {
      const text = 'Standard regulatory requirements.';
      const title = 'URGENT: New Emission Standards for Offshore Operations';

      const result = extractor.extractInsights(text, title);

      expect(result.whatChanged.toLowerCase()).toContain('emission');
      expect(result.whoImpacted.some(entity => entity.toLowerCase().includes('offshore'))).toBe(true);
    });
  });

  describe('change extraction', () => {
    it('should infer changes from content when explicit changes not found', () => {
      const emissionText = 'emission monitoring standards for operations.';
      const safetyText = 'safety protocols for personnel.';
      const generalText = 'standard operational requirements.';

      const emissionResult = extractor['inferChangesFromContent'](emissionText);
      const safetyResult = extractor['inferChangesFromContent'](safetyText);
      const generalResult = extractor['inferChangesFromContent'](generalText);

      expect(emissionResult).toBe('New emission standards and monitoring requirements');
      expect(safetyResult).toBe('Updated safety protocols and procedures');
      expect(generalResult).toBe('Updated regulatory compliance requirements');
    });

    it('should consolidate multiple changes', () => {
      const changes = [
        'New emission monitoring requirements',
        'Updated safety protocols',
        'Enhanced environmental protection'
      ];

      const consolidated = extractor['consolidateChanges'](changes);

      expect(consolidated).toBeTruthy();
      expect(consolidated.length).toBeGreaterThan(0);
    });
  });

  describe('action extraction', () => {
    it('should format actions properly', () => {
      const rawAction = 'must install monitoring equipment within 30 days';
      const formatted = extractor['formatAction'](rawAction);

      expect(formatted).toMatch(/^[A-Z]/); // Should start with capital letter
      expect(formatted).not.toMatch(/^must/i); // Should remove 'must' prefix
    });

    it('should extract actions from various patterns', () => {
      const text = `
        Operators shall implement new procedures.
        Companies must train all personnel.
        Facilities are required to install equipment.
        Personnel need to complete certification.
      `;

      const result = extractor.extractInsights(text);

      expect(result.requiredActions.length).toBeGreaterThan(2);
      expect(result.requiredActions.some(action => action.toLowerCase().includes('implement'))).toBe(true);
      expect(result.requiredActions.some(action => action.toLowerCase().includes('train'))).toBe(true);
    });
  });

  describe('text cleaning and formatting', () => {
    it('should clean extracted text properly', () => {
      const dirtyText = '  New   requirements!!!   @#$   ';
      const cleaned = extractor['cleanExtractedText'](dirtyText);

      expect(cleaned).toBe('New requirements');
    });

    it('should capitalize first letter', () => {
      const lowercase = 'test string';
      const capitalized = extractor['capitalizeFirst'](lowercase);

      expect(capitalized).toBe('Test string');
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const result = extractor.extractInsights('');

      expect(result).toBeDefined();
      expect(result.whatChanged).toBeTruthy();
      expect(result.whoImpacted).toBeInstanceOf(Array);
      expect(result.requiredActions).toBeInstanceOf(Array);
    });

    it('should handle very short text', () => {
      const result = extractor.extractInsights('New rule.');

      expect(result).toBeDefined();
      expect(result.complianceLevel).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should handle text without clear patterns', () => {
      const text = 'Lorem ipsum dolor sit amet consectetur adipiscing elit.';
      const result = extractor.extractInsights(text);

      expect(result).toBeDefined();
      expect(result.whoImpacted).toContain('Oil and gas operators'); // Should fall back to default
    });
  });
});