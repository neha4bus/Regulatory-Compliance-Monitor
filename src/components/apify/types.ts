/**
 * Types for Apify mock data collection system
 */

export interface ApifyActorConfig {
  sources: string[];
  schedule: string;
  outputFormat: 'json';
  maxRetries?: number;
  retryDelay?: number;
}

export interface ApifyScrapedData {
  id: string;
  title: string;
  date: string;
  url: string;
  fullText: string;
  source: string;
  scrapedAt: string;
}

export interface ScrapingResult {
  success: boolean;
  data?: ApifyScrapedData[];
  error?: string;
  retryCount?: number;
}

export interface DataSource {
  name: string;
  baseUrl: string;
  regulationTypes: string[];
  sampleTitles: string[];
  contentTemplates: string[];
}

export interface SchedulerOptions {
  interval: number; // milliseconds
  maxConcurrentJobs: number;
  enableRetries: boolean;
}