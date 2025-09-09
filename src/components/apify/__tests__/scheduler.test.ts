/**
 * Tests for ApifyScheduler
 */

import { ApifyScheduler } from '../scheduler';
import { MockApifyScraper, createMockApifyScraper } from '../mock-scraper';

// Mock timers for testing
jest.useFakeTimers();

// Mock the scraper to return quickly for tests
jest.mock('../mock-scraper', () => {
  const actual = jest.requireActual('../mock-scraper');
  
  class MockApifyScraperTest extends actual.MockApifyScraper {
    constructor(config: any) {
      super(config);
    }

    async runScraper() {
      return {
        success: true,
        data: [
          {
            id: 'test-1',
            title: 'Test Regulation',
            date: '2025-01-08',
            url: 'https://example.com/test',
            fullText: 'Test regulation content',
            source: 'Test Source',
            scrapedAt: new Date().toISOString()
          }
        ]
      };
    }

    async runWithRetry() {
      return {
        success: true,
        data: [
          {
            id: 'test-1',
            title: 'Test Regulation',
            date: '2025-01-08',
            url: 'https://example.com/test',
            fullText: 'Test regulation content',
            source: 'Test Source',
            scrapedAt: new Date().toISOString()
          }
        ],
        retryCount: 0
      };
    }
  }
  
  return {
    ...actual,
    MockApifyScraper: MockApifyScraperTest,
    createMockApifyScraper: (sources?: string[]) => new MockApifyScraperTest({
      sources: sources || ['https://example.com'],
      schedule: '0 */6 * * *',
      outputFormat: 'json',
      maxRetries: 3,
      retryDelay: 1000
    })
  };
});

describe('ApifyScheduler', () => {
  let scheduler: ApifyScheduler;
  let mockScraper: MockApifyScraper;

  beforeEach(() => {
    scheduler = new ApifyScheduler({
      interval: 1000, // 1 second for testing
      maxConcurrentJobs: 2,
      enableRetries: true
    });
    mockScraper = createMockApifyScraper();
  });

  afterEach(() => {
    scheduler.stopAll();
    jest.clearAllTimers();
  });

  describe('scheduleJob', () => {
    it('should schedule a new job', () => {
      const jobId = 'test-job-1';
      const jobName = 'Test Job';
      
      scheduler.scheduleJob(jobId, jobName, mockScraper);
      
      const job = scheduler.getJobStatus(jobId);
      expect(job).toBeDefined();
      expect(job!.id).toBe(jobId);
      expect(job!.name).toBe(jobName);
      expect(job!.isActive).toBe(true);
      expect(job!.runCount).toBe(0);
    });

    it('should emit jobScheduled event', (done) => {
      const jobId = 'test-job-1';
      const jobName = 'Test Job';
      
      scheduler.on('jobScheduled', (event) => {
        expect(event.jobId).toBe(jobId);
        expect(event.jobName).toBe(jobName);
        done();
      });
      
      scheduler.scheduleJob(jobId, jobName, mockScraper);
    });

    it('should use custom interval when provided', () => {
      const jobId = 'test-job-1';
      const customInterval = 5000;
      
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper, customInterval);
      
      const job = scheduler.getJobStatus(jobId);
      expect(job!.interval).toBe(customInterval);
    });
  });

  describe('runJobNow', () => {
    it('should run job immediately', async () => {
      const jobId = 'test-job-1';
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      
      const result = await scheduler.runJobNow(jobId);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      const job = scheduler.getJobStatus(jobId);
      expect(job!.runCount).toBe(1);
    }, 15000);

    it('should throw error for non-existent job', async () => {
      await expect(scheduler.runJobNow('non-existent')).rejects.toThrow('Job non-existent not found');
    });

    it('should prevent running same job concurrently', async () => {
      const jobId = 'test-job-1';
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      
      const promise1 = scheduler.runJobNow(jobId);
      const promise2 = scheduler.runJobNow(jobId);
      
      await expect(promise2).rejects.toThrow('already running');
      await promise1; // Wait for first to complete
    }, 15000);

    it('should respect max concurrent jobs limit', async () => {
      const scheduler = new ApifyScheduler({ maxConcurrentJobs: 1 });
      
      scheduler.scheduleJob('job1', 'Job 1', mockScraper);
      scheduler.scheduleJob('job2', 'Job 2', mockScraper);
      
      const promise1 = scheduler.runJobNow('job1');
      const promise2 = scheduler.runJobNow('job2');
      
      await expect(promise2).rejects.toThrow('Maximum concurrent jobs limit reached');
      await promise1;
    }, 15000);
  });

  describe('stopJob', () => {
    it('should stop active job', () => {
      const jobId = 'test-job-1';
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      
      const stopped = scheduler.stopJob(jobId);
      
      expect(stopped).toBe(true);
      const job = scheduler.getJobStatus(jobId);
      expect(job!.isActive).toBe(false);
    });

    it('should return false for non-existent job', () => {
      const stopped = scheduler.stopJob('non-existent');
      expect(stopped).toBe(false);
    });

    it('should emit jobStopped event', (done) => {
      const jobId = 'test-job-1';
      const jobName = 'Test Job';
      
      scheduler.scheduleJob(jobId, jobName, mockScraper);
      
      scheduler.on('jobStopped', (event) => {
        expect(event.jobId).toBe(jobId);
        expect(event.jobName).toBe(jobName);
        done();
      });
      
      scheduler.stopJob(jobId);
    });
  });

  describe('resumeJob', () => {
    it('should resume stopped job', () => {
      const jobId = 'test-job-1';
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      scheduler.stopJob(jobId);
      
      const resumed = scheduler.resumeJob(jobId);
      
      expect(resumed).toBe(true);
      const job = scheduler.getJobStatus(jobId);
      expect(job!.isActive).toBe(true);
    });

    it('should return false for non-existent job', () => {
      const resumed = scheduler.resumeJob('non-existent');
      expect(resumed).toBe(false);
    });
  });

  describe('removeJob', () => {
    it('should remove job completely', () => {
      const jobId = 'test-job-1';
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      
      const removed = scheduler.removeJob(jobId);
      
      expect(removed).toBe(true);
      const job = scheduler.getJobStatus(jobId);
      expect(job).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const removed = scheduler.removeJob('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getJobsStatus', () => {
    it('should return all jobs', () => {
      scheduler.scheduleJob('job1', 'Job 1', mockScraper);
      scheduler.scheduleJob('job2', 'Job 2', mockScraper);
      
      const jobs = scheduler.getJobsStatus();
      
      expect(jobs).toHaveLength(2);
      expect(jobs.map(j => j.id)).toContain('job1');
      expect(jobs.map(j => j.id)).toContain('job2');
    });

    it('should return empty array when no jobs', () => {
      const jobs = scheduler.getJobsStatus();
      expect(jobs).toHaveLength(0);
    });
  });

  describe('startDemoMode', () => {
    it('should update all job intervals', () => {
      const quickInterval = 5000;
      
      scheduler.scheduleJob('job1', 'Job 1', mockScraper, 60000);
      scheduler.scheduleJob('job2', 'Job 2', mockScraper, 120000);
      
      scheduler.startDemoMode(quickInterval);
      
      const jobs = scheduler.getJobsStatus();
      jobs.forEach(job => {
        expect(job.interval).toBe(quickInterval);
      });
    });

    it('should emit demoModeStarted event', (done) => {
      const quickInterval = 5000;
      
      scheduler.on('demoModeStarted', (event) => {
        expect(event.quickInterval).toBe(quickInterval);
        done();
      });
      
      scheduler.startDemoMode(quickInterval);
    });
  });

  describe('stopAll', () => {
    it('should stop all jobs', () => {
      scheduler.scheduleJob('job1', 'Job 1', mockScraper);
      scheduler.scheduleJob('job2', 'Job 2', mockScraper);
      
      scheduler.stopAll();
      
      const jobs = scheduler.getJobsStatus();
      jobs.forEach(job => {
        expect(job.isActive).toBe(false);
      });
    });

    it('should emit allJobsStopped event', (done) => {
      scheduler.on('allJobsStopped', () => {
        done();
      });
      
      scheduler.stopAll();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      scheduler.scheduleJob('job1', 'Job 1', mockScraper);
      scheduler.scheduleJob('job2', 'Job 2', mockScraper);
      scheduler.stopJob('job2');
      
      // Run one job to update stats
      await scheduler.runJobNow('job1');
      
      const stats = scheduler.getStats();
      
      expect(stats.totalJobs).toBe(2);
      expect(stats.activeJobs).toBe(1);
      expect(stats.runningJobs).toBe(0);
      expect(stats.totalRuns).toBe(1);
      expect(stats.totalSuccesses + stats.totalFailures).toBe(1);
    }, 15000);

    it('should return zero stats for empty scheduler', () => {
      const stats = scheduler.getStats();
      
      expect(stats.totalJobs).toBe(0);
      expect(stats.activeJobs).toBe(0);
      expect(stats.runningJobs).toBe(0);
      expect(stats.totalRuns).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
      expect(stats.totalFailures).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should emit jobStarted event when job begins', (done) => {
      const jobId = 'test-job-1';
      const jobName = 'Test Job';
      
      scheduler.scheduleJob(jobId, jobName, mockScraper);
      
      scheduler.on('jobStarted', (event) => {
        expect(event.jobId).toBe(jobId);
        expect(event.jobName).toBe(jobName);
        expect(event.runCount).toBe(1);
        done();
      });
      
      scheduler.runJobNow(jobId);
    });

    it('should emit jobCompleted event on success', (done) => {
      const jobId = 'test-job-1';
      
      scheduler.scheduleJob(jobId, 'Test Job', mockScraper);
      
      scheduler.on('jobCompleted', (event) => {
        expect(event.jobId).toBe(jobId);
        expect(event.result).toBeDefined();
        expect(event.result.success).toBe(true);
        done();
      });
      
      scheduler.runJobNow(jobId);
    });
  });

  describe('scheduled execution', () => {
    it('should execute jobs on schedule', (done) => {
      const jobId = 'scheduled-job';
      
      scheduler.scheduleJob(jobId, 'Scheduled Job', mockScraper, 100);
      
      scheduler.on('jobStarted', (event) => {
        if (event.jobId === jobId) {
          expect(event.runCount).toBe(1);
          done();
        }
      });
      
      // Fast-forward time to trigger scheduled execution
      jest.advanceTimersByTime(150);
    });
  });
});