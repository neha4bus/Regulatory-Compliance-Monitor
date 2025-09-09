/**
 * Mock Apify scraper that mimics real Apify output format
 */

import { ApifyActorConfig, ApifyScrapedData, ScrapingResult } from './types';
import { RegulatoryDataGenerator } from './data-generator';

export class MockApifyScraper {
  private dataGenerator: RegulatoryDataGenerator;
  private config: ApifyActorConfig;
  private isRunning: boolean = false;

  constructor(config: ApifyActorConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.dataGenerator = new RegulatoryDataGenerator();
  }

  /**
   * Simulate Apify actor run with realistic delays and potential failures
   */
  public async runScraper(): Promise<ScrapingResult> {
    if (this.isRunning) {
      return {
        success: false,
        error: 'Scraper is already running'
      };
    }

    this.isRunning = true;
    
    try {
      // Simulate network delay
      await this.simulateDelay(1000, 3000);
      
      // Simulate occasional failures for demo purposes
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error('Simulated network timeout');
      }

      const scrapedData = await this.scrapeAllSources();
      
      this.isRunning = false;
      return {
        success: true,
        data: scrapedData
      };
    } catch (error) {
      this.isRunning = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Run scraper with retry logic
   */
  public async runWithRetry(): Promise<ScrapingResult> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      const result = await this.runScraper();
      
      if (result.success) {
        return {
          ...result,
          retryCount: attempt
        };
      }
      
      lastError = result.error || 'Unknown error';
      
      if (attempt < (this.config.maxRetries || 3) - 1) {
        console.log(`Scraping attempt ${attempt + 1} failed: ${lastError}. Retrying in ${this.config.retryDelay}ms...`);
        await this.simulateDelay(this.config.retryDelay || 1000);
      }
    }
    
    return {
      success: false,
      error: `Failed after ${this.config.maxRetries} attempts. Last error: ${lastError}`,
      retryCount: this.config.maxRetries
    };
  }

  /**
   * Scrape specific source
   */
  public async scrapeSource(sourceName: string): Promise<ScrapingResult> {
    try {
      // Simulate source-specific delay
      await this.simulateDelay(500, 1500);
      
      // Check if source exists
      const availableSources = this.dataGenerator.getAvailableSources();
      if (!availableSources.includes(sourceName)) {
        throw new Error(`Unknown source: ${sourceName}`);
      }

      // Simulate occasional source-specific failures
      if (Math.random() < 0.05) { // 5% failure rate per source
        throw new Error(`Failed to access ${sourceName} - server returned 503`);
      }

      const data = this.dataGenerator.generateDataForSource(sourceName, 2);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get scraper status
   */
  public getStatus(): { isRunning: boolean; config: ApifyActorConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }

  /**
   * Update scraper configuration
   */
  public updateConfig(newConfig: Partial<ApifyActorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get available sources for scraping
   */
  public getAvailableSources(): string[] {
    return this.dataGenerator.getAvailableSources();
  }

  private async scrapeAllSources(): Promise<ApifyScrapedData[]> {
    const allData: ApifyScrapedData[] = [];
    const sources = this.dataGenerator.getAvailableSources();
    
    // Simulate scraping each source
    for (const source of sources) {
      try {
        // Simulate per-source delay
        await this.simulateDelay(200, 800);
        
        const sourceData = this.dataGenerator.generateDataForSource(source, 1);
        allData.push(...sourceData);
        
        console.log(`Successfully scraped ${sourceData.length} regulations from ${source}`);
      } catch (error) {
        console.warn(`Failed to scrape ${source}: ${error}`);
        // Continue with other sources even if one fails
      }
    }
    
    return allData;
  }

  private async simulateDelay(minMs: number, maxMs?: number): Promise<void> {
    const delay = maxMs ? 
      Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs : 
      minMs;
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Factory function to create configured mock scraper
 */
export function createMockApifyScraper(sources?: string[]): MockApifyScraper {
  const defaultConfig: ApifyActorConfig = {
    sources: sources || [
      'https://www.epa.gov/regulations',
      'https://www.energy.gov/policy',
      'https://www.rrc.texas.gov/rules',
      'https://www.api.org/standards'
    ],
    schedule: '0 */6 * * *', // Every 6 hours
    outputFormat: 'json',
    maxRetries: 3,
    retryDelay: 2000
  };

  return new MockApifyScraper(defaultConfig);
}