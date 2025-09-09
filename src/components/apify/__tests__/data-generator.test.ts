/**
 * Tests for RegulatoryDataGenerator
 */

import { RegulatoryDataGenerator } from '../data-generator';

describe('RegulatoryDataGenerator', () => {
  let generator: RegulatoryDataGenerator;

  beforeEach(() => {
    generator = new RegulatoryDataGenerator();
  });

  describe('generateSampleData', () => {
    it('should generate the requested number of regulations', () => {
      const count = 5;
      const data = generator.generateSampleData(count);
      
      expect(data).toHaveLength(count);
    });

    it('should generate regulations with all required fields', () => {
      const data = generator.generateSampleData(1);
      const regulation = data[0];
      
      expect(regulation).toHaveProperty('id');
      expect(regulation).toHaveProperty('title');
      expect(regulation).toHaveProperty('date');
      expect(regulation).toHaveProperty('url');
      expect(regulation).toHaveProperty('fullText');
      expect(regulation).toHaveProperty('source');
      expect(regulation).toHaveProperty('scrapedAt');
      
      expect(typeof regulation.id).toBe('string');
      expect(typeof regulation.title).toBe('string');
      expect(typeof regulation.date).toBe('string');
      expect(typeof regulation.url).toBe('string');
      expect(typeof regulation.fullText).toBe('string');
      expect(typeof regulation.source).toBe('string');
      expect(typeof regulation.scrapedAt).toBe('string');
    });

    it('should generate unique IDs for each regulation', () => {
      const data = generator.generateSampleData(10);
      const ids = data.map(r => r.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate valid date formats', () => {
      const data = generator.generateSampleData(5);
      
      data.forEach(regulation => {
        // Check date format (YYYY-MM-DD)
        expect(regulation.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Check scrapedAt format (ISO string)
        expect(() => new Date(regulation.scrapedAt)).not.toThrow();
      });
    });

    it('should generate realistic URLs', () => {
      const data = generator.generateSampleData(5);
      
      data.forEach(regulation => {
        expect(regulation.url).toMatch(/^https?:\/\/.+/);
        // URL should be well-formed and contain domain
        expect(regulation.url).toContain('.');
        expect(regulation.url.length).toBeGreaterThan(20);
      });
    });

    it('should generate substantial full text content', () => {
      const data = generator.generateSampleData(3);
      
      data.forEach(regulation => {
        expect(regulation.fullText.length).toBeGreaterThan(200);
        // Should contain regulatory-related terms
        const regulatoryTerms = ['regulation', 'standard', 'requirement', 'compliance', 'operator', 'safety'];
        const hasRegulatoryTerm = regulatoryTerms.some(term => 
          regulation.fullText.toLowerCase().includes(term)
        );
        expect(hasRegulatoryTerm).toBe(true);
      });
    });
  });

  describe('generateDataForSource', () => {
    it('should generate data for valid sources', () => {
      const sources = generator.getAvailableSources();
      
      sources.forEach(source => {
        const data = generator.generateDataForSource(source, 2);
        expect(data).toHaveLength(2);
        data.forEach(regulation => {
          expect(regulation.source).toBe(source);
        });
      });
    });

    it('should throw error for invalid source', () => {
      expect(() => {
        generator.generateDataForSource('InvalidSource', 1);
      }).toThrow('Unknown data source: InvalidSource');
    });

    it('should generate source-specific content', () => {
      const epaData = generator.generateDataForSource('EPA', 1);
      const doeData = generator.generateDataForSource('DOE', 1);
      
      expect(epaData[0].source).toBe('EPA');
      expect(doeData[0].source).toBe('DOE');
      expect(epaData[0].url).toContain('epa.gov');
      expect(doeData[0].url).toContain('energy.gov');
    });
  });

  describe('getAvailableSources', () => {
    it('should return array of source names', () => {
      const sources = generator.getAvailableSources();
      
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources).toContain('EPA');
      expect(sources).toContain('DOE');
    });

    it('should return consistent source list', () => {
      const sources1 = generator.getAvailableSources();
      const sources2 = generator.getAvailableSources();
      
      expect(sources1).toEqual(sources2);
    });
  });

  describe('data quality', () => {
    it('should generate realistic regulation titles', () => {
      const data = generator.generateSampleData(10);
      
      data.forEach(regulation => {
        expect(regulation.title.length).toBeGreaterThan(10);
        expect(regulation.title).toMatch(/[A-Z]/); // Should contain uppercase letters
      });
    });

    it('should generate dates within reasonable range', () => {
      const data = generator.generateSampleData(20);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      data.forEach(regulation => {
        const regDate = new Date(regulation.date);
        expect(regDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
        expect(regDate.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should generate varied content across multiple generations', () => {
      const data1 = generator.generateSampleData(5);
      const data2 = generator.generateSampleData(5);
      
      // Titles should be different (with high probability)
      const titles1 = data1.map(r => r.title);
      const titles2 = data2.map(r => r.title);
      const commonTitles = titles1.filter(t => titles2.includes(t));
      
      expect(commonTitles.length).toBeLessThan(titles1.length);
    });
  });
});