/**
 * Unit tests for Compliance Checklist Generation
 */

import { ComplianceChecklistGenerator } from '../compliance-checklist';

describe('ComplianceChecklistGenerator', () => {
  let generator: ComplianceChecklistGenerator;

  beforeEach(() => {
    generator = new ComplianceChecklistGenerator();
  });

  describe('generateChecklist', () => {
    it('should generate basic checklist for regulatory text', () => {
      const text = 'New emission monitoring requirements for offshore drilling operations.';
      const result = generator.generateChecklist(text);

      expect(result).toBeDefined();
      expect(result.title).toBeTruthy();
      expect(result.totalItems).toBeGreaterThan(0);
      expect(result.estimatedTotalHours).toBeGreaterThan(0);
      expect(result.categories).toBeInstanceOf(Array);
      expect(result.items).toBeInstanceOf(Array);
      expect(result.summary).toBeTruthy();
    });

    it('should identify emission category from text', () => {
      const text = 'New emission standards and pollution monitoring requirements.';
      const result = generator.generateChecklist(text);

      expect(result.categories).toContain('emission');
      expect(result.items.some(item => item.category === 'emission')).toBe(true);
    });

    it('should identify safety category from text', () => {
      const text = 'Updated safety protocols and hazard management procedures.';
      const result = generator.generateChecklist(text);

      expect(result.categories).toContain('safety');
      expect(result.items.some(item => item.category === 'safety')).toBe(true);
    });

    it('should identify reporting category from text', () => {
      const text = 'New reporting requirements and documentation standards.';
      const result = generator.generateChecklist(text);

      expect(result.categories).toContain('reporting');
      expect(result.items.some(item => item.category === 'reporting')).toBe(true);
    });

    it('should adjust priorities based on risk level', () => {
      const text = 'Standard regulatory requirements.';
      const highRiskResult = generator.generateChecklist(text, undefined, undefined, 'critical');
      const lowRiskResult = generator.generateChecklist(text, undefined, undefined, 'low');

      const highPriorityItems = highRiskResult.items.filter(item => 
        item.priority === 'high' || item.priority === 'critical'
      );
      const lowPriorityItems = lowRiskResult.items.filter(item => 
        item.priority === 'high' || item.priority === 'critical'
      );

      expect(highPriorityItems.length).toBeGreaterThanOrEqual(lowPriorityItems.length);
    });

    it('should generate specific items based on content', () => {
      const text = 'All personnel must complete training and certification within 30 days. New equipment installation required.';
      const result = generator.generateChecklist(text);

      expect(result.items.some(item => 
        item.task.toLowerCase().includes('training')
      )).toBe(true);
      expect(result.items.some(item => 
        item.task.toLowerCase().includes('equipment')
      )).toBe(true);
    });

    it('should include title in checklist title when provided', () => {
      const text = 'Standard requirements.';
      const title = 'New Emission Standards for Offshore Operations';
      const result = generator.generateChecklist(text, title);

      expect(result.title).toContain(title);
    });
  });

  describe('checklist item creation', () => {
    it('should create properly formatted checklist items', () => {
      const text = 'Safety training requirements for all personnel.';
      const result = generator.generateChecklist(text);

      result.items.forEach(item => {
        expect(item.id).toMatch(/^CL-\d{3}$/);
        expect(item.task).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.priority).toMatch(/^(low|medium|high|critical)$/);
        expect(item.category).toBeTruthy();
        expect(item.estimatedHours).toBeGreaterThan(0);
        expect(item.dependencies).toBeInstanceOf(Array);
      });
    });

    it('should assign appropriate responsible parties', () => {
      const text = 'Safety protocols, environmental monitoring, and technical equipment requirements.';
      const result = generator.generateChecklist(text);

      const safetyItems = result.items.filter(item => item.category === 'safety');
      const environmentalItems = result.items.filter(item => item.category === 'environmental');

      if (safetyItems.length > 0) {
        expect(safetyItems[0].responsible).toBe('Safety Manager');
      }
      if (environmentalItems.length > 0) {
        expect(environmentalItems[0].responsible).toBe('Environmental Manager');
      }
    });

    it('should estimate hours based on task type', () => {
      const assessmentHours = generator['ESTIMATED_HOURS']['assessment'];
      const trainingHours = generator['ESTIMATED_HOURS']['training'];
      const implementationHours = generator['ESTIMATED_HOURS']['implementation'];

      expect(assessmentHours).toBeLessThan(trainingHours);
      expect(trainingHours).toBeLessThan(implementationHours);
    });
  });

  describe('category identification', () => {
    it('should identify multiple categories from complex text', () => {
      const text = `
        New emission monitoring and safety protocols required.
        Environmental impact assessments must be conducted.
        Regular reporting and inspection procedures established.
      `;
      const categories = generator['identifyCategories'](text);

      expect(categories).toContain('emission');
      expect(categories).toContain('safety');
      expect(categories).toContain('environmental');
      expect(categories).toContain('reporting');
      expect(categories).toContain('inspection');
      expect(categories).toContain('general');
    });

    it('should always include general category', () => {
      const text = 'Specific technical requirements.';
      const categories = generator['identifyCategories'](text);

      expect(categories).toContain('general');
    });
  });

  describe('task dependencies', () => {
    it('should identify implementation dependencies', () => {
      const dependencies = generator['identifyDependencies']('implement new procedures', 'general');
      expect(dependencies).toContain('Assessment and gap analysis');
    });

    it('should identify training dependencies', () => {
      const dependencies = generator['identifyDependencies']('train personnel', 'safety');
      expect(dependencies).toContain('Updated procedures and documentation');
    });

    it('should identify monitoring dependencies', () => {
      const dependencies = generator['identifyDependencies']('monitor compliance', 'general');
      expect(dependencies).toContain('Implementation of new procedures');
    });
  });

  describe('priority adjustment', () => {
    it('should adjust priority based on risk level', () => {
      const basePriority = 'medium';
      const criticalAdjusted = generator['adjustPriorityForRisk'](basePriority, 'critical');
      const lowAdjusted = generator['adjustPriorityForRisk'](basePriority, 'low');

      expect(criticalAdjusted).toBe('critical');
      expect(lowAdjusted).toBe(basePriority);
    });

    it('should not downgrade priority', () => {
      const highPriority = 'high';
      const adjusted = generator['adjustPriorityForRisk'](highPriority, 'low');

      expect(adjusted).toBe(highPriority);
    });
  });

  describe('checklist sorting', () => {
    it('should sort items by priority and category', () => {
      const items = [
        { priority: 'low', category: 'general', task: 'Task A' },
        { priority: 'critical', category: 'safety', task: 'Task B' },
        { priority: 'medium', category: 'emission', task: 'Task C' },
        { priority: 'high', category: 'safety', task: 'Task D' },
      ] as any[];

      const sorted = generator['sortChecklistItems'](items);

      expect(sorted[0].priority).toBe('critical');
      expect(sorted[sorted.length - 1].priority).toBe('low');
    });
  });

  describe('summary generation', () => {
    it('should generate informative summary', () => {
      const text = 'Critical safety requirements with immediate compliance needed.';
      const result = generator.generateChecklist(text);

      expect(result.summary).toContain(result.totalItems.toString());
      expect(result.summary).toContain(result.categories.length.toString());
      expect(result.summary).toContain(result.estimatedTotalHours.toString());
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const result = generator.generateChecklist('');

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.categories).toContain('general');
    });

    it('should handle text without specific categories', () => {
      const text = 'Generic regulatory requirements without specific keywords.';
      const result = generator.generateChecklist(text);

      expect(result.categories).toContain('general');
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});