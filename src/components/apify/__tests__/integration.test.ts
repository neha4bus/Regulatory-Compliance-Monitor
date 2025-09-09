/**
 * Integration tests for Apify mock data collection system
 * Tests the complete workflow from data generation to scheduled collection
 */

import { createMockApifyScraper } from '../mock-scraper';
import { ApifyScheduler } from '../scheduler';
import { RegulatoryDataGenerator } from '../data-generator';

describe('Apify Integration Tests', () => {
  describe('End-to-End Data Collection Workflow', () => {
    it('should complete full data collection workflow', async () => {
      // 1. Create data generator and verify sources
      const generator = new RegulatoryDataGenerator();
      const availableSources = generator.getAvailableSources();
      
      expect(availableSources.length).toBeGreaterThan(0);
      expect(availableSources).toContain('EPA');
      expect(availableSources).toContain('DOE');

      // 2. Create mock scraper with realistic configuration
      const scraper = createMockApifyScraper();
      const scraperSources = scraper.getAvailableSources();
      
      expect(scraperSources).toEqual(availableSources);

      // 3. Test retry mechanism (which should eventually succeed)
      const retryResult = await scraper.runWithRetry();
      
      expect(retryResult.success).toBe(true);
      expect(retryResult).toHaveProperty('retryCount');
      expect(typeof retryResult.retryCount).toBe('number');
      expect(retryResult.data).toBeDefined();
      expect(retryResult.data!.length).toBeGreaterThan(0);

      // Verify data structure
      const regulation = retryResult.data![0];
      expect(regulation).toHaveProperty('id');
      expect(regulation).toHaveProperty('title');
      expect(regulation).toHaveProperty('source');
      expect(regulation).toHaveProperty('fullText');
      expect(regulation.fullText.length).toBeGreaterThan(100);

      // 4. Test source-specific scraping with retry for demo stability
      const testSource = availableSources[0]; // Test just one source
      let sourceResult = await scraper.scrapeSource(testSource);
      
      // Retry up to 3 times if failed (simulated failures are expected)
      let retries = 0;
      while (!sourceResult.success && retries < 3) {
        sourceResult = await scraper.scrapeSource(testSource);
        retries++;
      }
      
      expect(sourceResult.success).toBe(true);
      expect(sourceResult.data).toBeDefined();
      sourceResult.data!.forEach(reg => {
        expect(reg.source).toBe(testSource);
      });
    }, 30000);

    it('should handle scheduled data collection for demo', async () => {
      // Create scheduler with demo-friendly settings
      const scheduler = new ApifyScheduler({
        interval: 1000, // 1 second for testing
        maxConcurrentJobs: 1, // Limit to 1 to avoid conflicts
        enableRetries: true
      });

      const scraper = createMockApifyScraper();

      // Track events for verification
      const events: string[] = [];
      
      scheduler.on('jobScheduled', (event) => {
        events.push(`scheduled:${event.jobId}`);
      });
      
      scheduler.on('jobStarted', (event) => {
        events.push(`started:${event.jobId}`);
      });
      
      scheduler.on('jobCompleted', (event) => {
        events.push(`completed:${event.jobId}`);
      });

      // Schedule one job for testing
      scheduler.scheduleJob('test-job', 'Test Monitor', scraper);

      // Verify job is scheduled
      const jobs = scheduler.getJobsStatus();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].isActive).toBe(true);

      // Test running the job
      const result = await scheduler.runJobNow('test-job');
      expect(result.success).toBe(true);

      // Verify events were emitted
      expect(events).toContain('scheduled:test-job');
      expect(events).toContain('started:test-job');

      // Check statistics
      const stats = scheduler.getStats();
      expect(stats.totalJobs).toBe(1);
      expect(stats.totalRuns).toBeGreaterThanOrEqual(1);

      // Test scheduler management functions
      expect(scheduler.stopJob('test-job')).toBe(true);
      expect(scheduler.resumeJob('test-job')).toBe(true);
      
      // Test demo mode
      scheduler.startDemoMode(100);
      expect(scheduler.getJobStatus('test-job')!.interval).toBe(100);

      // Clean up
      scheduler.stopAll();
    }, 15000);

    it('should demonstrate demo-ready features', async () => {
      const generator = new RegulatoryDataGenerator();
      
      // Generate sample data for different sources
      const epaData = generator.generateDataForSource('EPA', 2);
      const doeData = generator.generateDataForSource('DOE', 2);
      
      // Verify data is demo-appropriate
      [...epaData, ...doeData].forEach(regulation => {
        // Should have realistic titles
        expect(regulation.title.length).toBeGreaterThan(20);
        expect(regulation.title).toMatch(/[A-Z]/);
        
        // Should have substantial content
        expect(regulation.fullText.length).toBeGreaterThan(200);
        // Should contain regulatory-related terms
        const regulatoryTerms = ['regulation', 'standard', 'requirement', 'compliance', 'operator', 'safety'];
        const hasRegulatoryTerm = regulatoryTerms.some(term => 
          regulation.fullText.toLowerCase().includes(term)
        );
        expect(hasRegulatoryTerm).toBe(true);
        
        // Should have proper URLs
        expect(regulation.url).toMatch(/^https?:\/\/.+/);
        
        // Should have recent dates
        const regDate = new Date(regulation.date);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        expect(regDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      });

      // Test error handling for demo stability
      const scraper = createMockApifyScraper();
      
      // Test invalid source handling
      const invalidResult = await scraper.scrapeSource('InvalidSource');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Unknown source');

      // Test concurrent execution prevention
      const promise1 = scraper.runScraper();
      const promise2 = scraper.runScraper();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // One should succeed, one should fail
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);
    }, 20000);

    it('should provide consistent data format for downstream processing', async () => {
      const scraper = createMockApifyScraper();
      
      // Run multiple scraping operations
      const results = await Promise.all([
        scraper.runScraper(),
        scraper.runWithRetry(),
        scraper.scrapeSource('EPA'),
        scraper.scrapeSource('DOE')
      ]);

      // All should succeed (with high probability)
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThanOrEqual(3);

      // Collect all regulations from successful results
      const allRegulations = successfulResults
        .flatMap(result => result.data || []);

      expect(allRegulations.length).toBeGreaterThan(0);

      // Verify consistent data structure across all regulations
      allRegulations.forEach(regulation => {
        // Required fields
        expect(regulation).toHaveProperty('id');
        expect(regulation).toHaveProperty('title');
        expect(regulation).toHaveProperty('date');
        expect(regulation).toHaveProperty('url');
        expect(regulation).toHaveProperty('fullText');
        expect(regulation).toHaveProperty('source');
        expect(regulation).toHaveProperty('scrapedAt');

        // Field types
        expect(typeof regulation.id).toBe('string');
        expect(typeof regulation.title).toBe('string');
        expect(typeof regulation.date).toBe('string');
        expect(typeof regulation.url).toBe('string');
        expect(typeof regulation.fullText).toBe('string');
        expect(typeof regulation.source).toBe('string');
        expect(typeof regulation.scrapedAt).toBe('string');

        // Date formats
        expect(regulation.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(() => new Date(regulation.scrapedAt)).not.toThrow();

        // Content quality
        expect(regulation.title.length).toBeGreaterThan(10);
        expect(regulation.fullText.length).toBeGreaterThan(100);
        expect(regulation.url).toMatch(/^https?:\/\/.+/);
      });

      // Verify unique IDs
      const ids = allRegulations.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }, 25000);
  });

  describe('Demo Performance and Reliability', () => {
    it('should handle multiple concurrent operations for demo stability', async () => {
      const scraper = createMockApifyScraper();
      
      // Test multiple source-specific scraping operations
      const sourcePromises = scraper.getAvailableSources().map(source => 
        scraper.scrapeSource(source)
      );

      const sourceResults = await Promise.all(sourcePromises);
      
      // Most should succeed (allowing for some simulated failures)
      const successfulSources = sourceResults.filter(r => r.success);
      expect(successfulSources.length).toBeGreaterThanOrEqual(Math.floor(sourceResults.length * 0.5)); // At least 50% should succeed

      // Verify data from successful sources
      successfulSources.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.data!.length).toBeGreaterThan(0);
      });
    }, 15000);

    it('should provide fallback mechanisms for demo resilience', async () => {
      const scheduler = new ApifyScheduler({
        interval: 500,
        maxConcurrentJobs: 1,
        enableRetries: true
      });

      const scraper = createMockApifyScraper();
      scheduler.scheduleJob('resilience-test', 'Resilience Test', scraper);

      // Test job management
      expect(scheduler.getJobStatus('resilience-test')).toBeDefined();
      
      // Test stop/resume functionality
      expect(scheduler.stopJob('resilience-test')).toBe(true);
      expect(scheduler.getJobStatus('resilience-test')!.isActive).toBe(false);
      
      expect(scheduler.resumeJob('resilience-test')).toBe(true);
      expect(scheduler.getJobStatus('resilience-test')!.isActive).toBe(true);

      // Test demo mode
      scheduler.startDemoMode(100);
      expect(scheduler.getJobStatus('resilience-test')!.interval).toBe(100);

      // Clean up
      scheduler.stopAll();
    });
  });
});