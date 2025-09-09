/**
 * Scheduled data ingestion simulation for demo purposes
 */

import { EventEmitter } from 'events';
import { MockApifyScraper } from './mock-scraper';
import { SchedulerOptions, ScrapingResult } from './types';

export interface ScheduledJob {
  id: string;
  name: string;
  scraper: MockApifyScraper;
  interval: number;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
  runCount: number;
  successCount: number;
  failureCount: number;
}

export class ApifyScheduler extends EventEmitter {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private options: SchedulerOptions;
  private runningJobs: Set<string> = new Set();

  constructor(options: Partial<SchedulerOptions> = {}) {
    super();
    this.options = {
      interval: 6 * 60 * 60 * 1000, // 6 hours default
      maxConcurrentJobs: 3,
      enableRetries: true,
      ...options
    };
  }

  /**
   * Schedule a scraping job
   */
  public scheduleJob(
    jobId: string, 
    jobName: string, 
    scraper: MockApifyScraper, 
    intervalMs?: number
  ): void {
    const interval = intervalMs || this.options.interval;
    
    const job: ScheduledJob = {
      id: jobId,
      name: jobName,
      scraper: scraper,
      interval: interval,
      nextRun: new Date(Date.now() + interval),
      isActive: true,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    };

    this.jobs.set(jobId, job);
    this.scheduleNextRun(jobId);
    
    this.emit('jobScheduled', { jobId, jobName, interval });
    console.log(`Scheduled job '${jobName}' (${jobId}) to run every ${interval}ms`);
  }

  /**
   * Start a job immediately (for demo purposes)
   */
  public async runJobNow(jobId: string): Promise<ScrapingResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.runningJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    if (this.runningJobs.size >= this.options.maxConcurrentJobs) {
      throw new Error('Maximum concurrent jobs limit reached');
    }

    return await this.executeJob(job);
  }

  /**
   * Stop a scheduled job
   */
  public stopJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    job.isActive = false;
    
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    this.emit('jobStopped', { jobId, jobName: job.name });
    console.log(`Stopped job '${job.name}' (${jobId})`);
    return true;
  }

  /**
   * Resume a stopped job
   */
  public resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    job.isActive = true;
    job.nextRun = new Date(Date.now() + job.interval);
    this.scheduleNextRun(jobId);

    this.emit('jobResumed', { jobId, jobName: job.name });
    console.log(`Resumed job '${job.name}' (${jobId})`);
    return true;
  }

  /**
   * Remove a job completely
   */
  public removeJob(jobId: string): boolean {
    this.stopJob(jobId);
    const removed = this.jobs.delete(jobId);
    
    if (removed) {
      this.emit('jobRemoved', { jobId });
      console.log(`Removed job ${jobId}`);
    }
    
    return removed;
  }

  /**
   * Get all jobs status
   */
  public getJobsStatus(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get specific job status
   */
  public getJobStatus(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Start scheduler (for demo - runs jobs more frequently)
   */
  public startDemoMode(quickInterval: number = 30000): void {
    console.log('Starting scheduler in demo mode with quick intervals');
    
    for (const [jobId, job] of this.jobs.entries()) {
      job.interval = quickInterval;
      job.nextRun = new Date(Date.now() + quickInterval);
      
      if (job.isActive) {
        this.scheduleNextRun(jobId);
      }
    }

    this.emit('demoModeStarted', { quickInterval });
  }

  /**
   * Stop all jobs
   */
  public stopAll(): void {
    for (const jobId of this.jobs.keys()) {
      this.stopJob(jobId);
    }
    
    this.emit('allJobsStopped');
    console.log('All scheduled jobs stopped');
  }

  /**
   * Get scheduler statistics
   */
  public getStats(): {
    totalJobs: number;
    activeJobs: number;
    runningJobs: number;
    totalRuns: number;
    totalSuccesses: number;
    totalFailures: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.isActive).length,
      runningJobs: this.runningJobs.size,
      totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0),
      totalSuccesses: jobs.reduce((sum, j) => sum + j.successCount, 0),
      totalFailures: jobs.reduce((sum, j) => sum + j.failureCount, 0)
    };
  }

  private scheduleNextRun(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || !job.isActive) {
      return;
    }

    // Clear existing timer
    const existingTimer = this.timers.get(jobId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule next run
    const timer = setTimeout(async () => {
      if (job.isActive && !this.runningJobs.has(jobId)) {
        await this.executeJob(job);
        this.scheduleNextRun(jobId); // Schedule next run after completion
      }
    }, job.interval);

    this.timers.set(jobId, timer);
  }

  private async executeJob(job: ScheduledJob): Promise<ScrapingResult> {
    this.runningJobs.add(job.id);
    job.runCount++;
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.interval);

    this.emit('jobStarted', { 
      jobId: job.id, 
      jobName: job.name, 
      runCount: job.runCount 
    });

    console.log(`Executing job '${job.name}' (${job.id}) - Run #${job.runCount}`);

    try {
      const result = this.options.enableRetries ? 
        await job.scraper.runWithRetry() : 
        await job.scraper.runScraper();

      if (result.success) {
        job.successCount++;
        this.emit('jobCompleted', { 
          jobId: job.id, 
          jobName: job.name, 
          result,
          runCount: job.runCount 
        });
        console.log(`Job '${job.name}' completed successfully. Found ${result.data?.length || 0} regulations.`);
      } else {
        job.failureCount++;
        this.emit('jobFailed', { 
          jobId: job.id, 
          jobName: job.name, 
          error: result.error,
          runCount: job.runCount 
        });
        console.error(`Job '${job.name}' failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      job.failureCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('jobError', { 
        jobId: job.id, 
        jobName: job.name, 
        error: errorMessage,
        runCount: job.runCount 
      });
      
      console.error(`Job '${job.name}' encountered error: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      this.runningJobs.delete(job.id);
    }
  }
}