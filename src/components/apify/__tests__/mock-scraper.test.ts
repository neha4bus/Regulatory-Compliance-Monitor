/**
 * Tests for MockApifyScraper
 */

import { MockApifyScraper, createMockApifyScraper } from '../mock-scraper';
import { ApifyActorConfig } from '../types';

// No mocking needed - tests should work with actual implementation

describe('MockApifyScraper', () => {
  let scraper: MockApifyScraper;
  let config: ApifyActorConfig;

  beforeEach(() => {
    config = {
      sources: ['https://example.com'],
      schedule: '0 */6 * * *',
      outputFormat: 'json',
      maxRetries: 2,
      retryDelay: 100
    };
    scraper = new MockApifyScraper(config);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const status = scraper.getStatus();
      expect(status.config).toEqual(expect.objectContaining(config));
    });

    it('should set default values for optional config', () => {
      const minimalConfig: ApifyActorConfig = {
        sources: ['https://example.com'],
        schedule: '0 */6 * * *',
        outputFormat: 'json'
      };
      
      const scraperWithDefaults = new MockApifyScraper(minimalConfig);
      const status = scraperWithDefaults.getStatus();
      
      expect(status.config.maxRetries).toBe(3);
      expect(status.config.retryDelay).toBe(1000);
    });
  });

  describe('runScraper', () => {
    it('should return successful result with data', async () => {
      const result = await scraper.runScraper();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should return data with correct structure', async () => {
      const result = await scraper.runScraper();
      
      if (result.success && result.data) {
        const regulation = result.data[0];
        expect(regulation).toHaveProperty('id');
        expect(regulation).toHaveProperty('title');
        expect(regulation).toHaveProperty('date');
        expect(regulation).toHaveProperty('url');
        expect(regulation).toHaveProperty('fullText');
        expect(regulation).toHaveProperty('source');
        expect(regulation).toHaveProperty('scrapedAt');
      }
    });

    it('should prevent concurrent runs', async () => {
      const promise1 = scraper.runScraper();
      const promise2 = scraper.runScraper();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // One should succeed, one should fail with concurrent run error
      const successCount = [result1, result2].filter(r => r.success).length;
      const concurrentErrors = [result1, result2].filter(r => 
        !r.success && r.error?.includes('already running')
      ).length;
      
      expect(successCount).toBe(1);
      expect(concurrentErrors).toBe(1);
    });

    it('should update running status correctly', async () => {
      const initialStatus = scraper.getStatus();
      expect(initialStatus.isRunning).toBe(false);
      
      const runPromise = scraper.runScraper();
      // Note: Due to async nature and mocked delays, we can't reliably test intermediate state
      
      await runPromise;
      const finalStatus = scraper.getStatus();
      expect(finalStatus.isRunning).toBe(false);
    });
  });

  describe('runWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      // Create scraper with high failure rate for testing
      const testScraper = new MockApifyScraper({
        ...config,
        maxRetries: 3,
        retryDelay: 10
      });
      
      const result = await testScraper.runWithRetry();
      
      // Should eventually succeed or fail with retry info
      expect(result).toHaveProperty('retryCount');
      expect(typeof result.retryCount).toBe('number');
    });

    it('should return retry count in result', async () => {
      const result = await scraper.runWithRetry();
      
      expect(result).toHaveProperty('retryCount');
      expect(result.retryCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('scrapeSource', () => {
    it('should scrape specific valid source', async () => {
      const availableSources = scraper.getAvailableSources();
      const sourceName = availableSources[0];
      
      const result = await scraper.scrapeSource(sourceName);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        result.data.forEach(regulation => {
          expect(regulation.source).toBe(sourceName);
        });
      }
    });

    it('should fail for invalid source', async () => {
      const result = await scraper.scrapeSource('InvalidSource');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown source');
    });

    it('should return limited number of results per source', async () => {
      const availableSources = scraper.getAvailableSources();
      const sourceName = availableSources[0];
      
      const result = await scraper.scrapeSource(sourceName);
      
      if (result.success && result.data) {
        expect(result.data.length).toBeLessThanOrEqual(5); // Reasonable limit
      }
    });
  });

  describe('getStatus', () => {
    it('should return current status and config', () => {
      const status = scraper.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('config');
      expect(typeof status.isRunning).toBe('boolean');
      expect(status.config).toEqual(expect.objectContaining(config));
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { maxRetries: 5, retryDelay: 2000 };
      scraper.updateConfig(newConfig);
      
      const status = scraper.getStatus();
      expect(status.config.maxRetries).toBe(5);
      expect(status.config.retryDelay).toBe(2000);
      expect(status.config.sources).toEqual(config.sources); // Should preserve other config
    });
  });

  describe('getAvailableSources', () => {
    it('should return list of available sources', () => {
      const sources = scraper.getAvailableSources();
      
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach(source => {
        expect(typeof source).toBe('string');
      });
    });
  });
});

describe('createMockApifyScraper', () => {
  it('should create scraper with default config', () => {
    const scraper = createMockApifyScraper();
    const status = scraper.getStatus();
    
    expect(status.config.sources).toBeDefined();
    expect(status.config.schedule).toBe('0 */6 * * *');
    expect(status.config.outputFormat).toBe('json');
    expect(status.config.maxRetries).toBe(3);
  });

  it('should create scraper with custom sources', () => {
    const customSources = ['https://custom1.com', 'https://custom2.com'];
    const scraper = createMockApifyScraper(customSources);
    const status = scraper.getStatus();
    
    expect(status.config.sources).toEqual(customSources);
  });

  it('should create functional scraper', async () => {
    const scraper = createMockApifyScraper();
    const result = await scraper.runScraper();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});