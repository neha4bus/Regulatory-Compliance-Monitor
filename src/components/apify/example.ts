/**
 * Example usage of the Apify mock data collection system
 * This demonstrates how to use the mock scraper and scheduler for demo purposes
 */

import { createMockApifyScraper } from './mock-scraper';
import { ApifyScheduler } from './scheduler';
import { RegulatoryDataGenerator } from './data-generator';

/**
 * Basic scraper usage example
 */
export async function basicScrapingExample(): Promise<void> {
  console.log('=== Basic Scraping Example ===');
  
  // Create a mock scraper with default configuration
  const scraper = createMockApifyScraper();
  
  console.log('Available sources:', scraper.getAvailableSources());
  
  // Run a single scraping operation
  console.log('Running scraper...');
  const result = await scraper.runScraper();
  
  if (result.success) {
    console.log(`Successfully scraped ${result.data?.length} regulations`);
    result.data?.forEach((regulation, index) => {
      console.log(`${index + 1}. ${regulation.title} (${regulation.source})`);
    });
  } else {
    console.error('Scraping failed:', result.error);
  }
}

/**
 * Scraper with retry logic example
 */
export async function retryScrapingExample(): Promise<void> {
  console.log('\n=== Retry Scraping Example ===');
  
  const scraper = createMockApifyScraper();
  
  // Run with retry logic (useful for demo stability)
  console.log('Running scraper with retry logic...');
  const result = await scraper.runWithRetry();
  
  if (result.success) {
    console.log(`Scraping succeeded after ${result.retryCount} retries`);
    console.log(`Found ${result.data?.length} regulations`);
  } else {
    console.error(`Scraping failed after ${result.retryCount} retries:`, result.error);
  }
}

/**
 * Source-specific scraping example
 */
export async function sourceSpecificExample(): Promise<void> {
  console.log('\n=== Source-Specific Scraping Example ===');
  
  const scraper = createMockApifyScraper();
  const sources = ['EPA', 'DOE', 'Texas Railroad Commission'];
  
  for (const source of sources) {
    console.log(`\nScraping ${source}...`);
    const result = await scraper.scrapeSource(source);
    
    if (result.success) {
      console.log(`Found ${result.data?.length} regulations from ${source}`);
      result.data?.forEach(regulation => {
        console.log(`  - ${regulation.title}`);
      });
    } else {
      console.error(`Failed to scrape ${source}:`, result.error);
    }
  }
}

/**
 * Scheduled scraping example
 */
export async function scheduledScrapingExample(): Promise<void> {
  console.log('\n=== Scheduled Scraping Example ===');
  
  const scheduler = new ApifyScheduler({
    interval: 10000, // 10 seconds for demo
    maxConcurrentJobs: 2,
    enableRetries: true
  });
  
  // Create scrapers for different sources
  const epaScraper = createMockApifyScraper(['https://www.epa.gov/regulations']);
  const doeScraper = createMockApifyScraper(['https://www.energy.gov/policy']);
  
  // Schedule jobs
  scheduler.scheduleJob('epa-monitor', 'EPA Regulation Monitor', epaScraper);
  scheduler.scheduleJob('doe-monitor', 'DOE Policy Monitor', doeScraper);
  
  // Set up event listeners for demo
  scheduler.on('jobStarted', (event) => {
    console.log(`Started job: ${event.jobName} (Run #${event.runCount})`);
  });
  
  scheduler.on('jobCompleted', (event) => {
    console.log(`Completed job: ${event.jobName}`);
    if (event.result.success) {
      console.log(`  Found ${event.result.data?.length} new regulations`);
    }
  });
  
  scheduler.on('jobFailed', (event) => {
    console.error(`Job failed: ${event.jobName} - ${event.error}`);
  });
  
  // Start demo mode with quick intervals
  console.log('Starting scheduler in demo mode...');
  scheduler.startDemoMode(5000); // 5 second intervals for demo
  
  // Run jobs immediately for demo
  console.log('Running initial scraping jobs...');
  await scheduler.runJobNow('epa-monitor');
  await scheduler.runJobNow('doe-monitor');
  
  // Show scheduler statistics
  const stats = scheduler.getStats();
  console.log('\nScheduler Statistics:');
  console.log(`  Total Jobs: ${stats.totalJobs}`);
  console.log(`  Active Jobs: ${stats.activeJobs}`);
  console.log(`  Total Runs: ${stats.totalRuns}`);
  console.log(`  Success Rate: ${stats.totalRuns > 0 ? (stats.totalSuccesses / stats.totalRuns * 100).toFixed(1) : 0}%`);
  
  // Clean up
  setTimeout(() => {
    scheduler.stopAll();
    console.log('Scheduler stopped');
  }, 15000);
}

/**
 * Data generation example
 */
export function dataGenerationExample(): void {
  console.log('\n=== Data Generation Example ===');
  
  const generator = new RegulatoryDataGenerator();
  
  // Generate sample data
  console.log('Generating sample regulatory data...');
  const sampleData = generator.generateSampleData(3);
  
  sampleData.forEach((regulation, index) => {
    console.log(`\n${index + 1}. ${regulation.title}`);
    console.log(`   Source: ${regulation.source}`);
    console.log(`   Date: ${regulation.date}`);
    console.log(`   URL: ${regulation.url}`);
    console.log(`   Content: ${regulation.fullText.substring(0, 150)}...`);
  });
  
  // Show available sources
  console.log('\nAvailable data sources:');
  generator.getAvailableSources().forEach(source => {
    console.log(`  - ${source}`);
  });
}

/**
 * Error handling and resilience example
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('\n=== Error Handling Example ===');
  
  const scraper = createMockApifyScraper();
  
  // Test invalid source handling
  console.log('Testing invalid source handling...');
  const invalidResult = await scraper.scrapeSource('InvalidSource');
  console.log('Invalid source result:', invalidResult);
  
  // Test concurrent execution prevention
  console.log('\nTesting concurrent execution prevention...');
  const promise1 = scraper.runScraper();
  const promise2 = scraper.runScraper();
  
  const [result1, result2] = await Promise.all([promise1, promise2]);
  console.log('First run success:', result1.success);
  console.log('Second run success:', result2.success);
  console.log('Second run error:', result2.error);
  
  // Test retry mechanism
  console.log('\nTesting retry mechanism...');
  const retryResult = await scraper.runWithRetry();
  console.log(`Retry result: ${retryResult.success ? 'Success' : 'Failed'} after ${retryResult.retryCount} retries`);
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Apify Mock Data Collection System Demo\n');
  
  try {
    await basicScrapingExample();
    await retryScrapingExample();
    await sourceSpecificExample();
    dataGenerationExample();
    await errorHandlingExample();
    await scheduledScrapingExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}