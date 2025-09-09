/**
 * Main Integration Orchestrator
 * Connects Apify data collection -> Redis storage -> Qodo AI analysis -> Lovable dashboard
 */

import { EventEmitter } from 'events';
import { RedisService } from '../components/redis';
import { QodoService } from '../components/qodo';
import { MockApifyScraper, createMockApifyScraper } from '../components/apify';
import { Regulation, ApifyScrapedData, WorkflowState } from '../types';

export interface IntegrationConfig {
  redis?: any;
  qodo?: any;
  enableRealTimeUpdates?: boolean;
  demoMode?: boolean;
}

export class IntegrationOrchestrator extends EventEmitter {
  private redisService: RedisService;
  private qodoService: QodoService;
  private mockScraper: MockApifyScraper;
  private config: IntegrationConfig;
  private isRunning: boolean = false;

  constructor(config: IntegrationConfig = {}) {
    super();
    this.config = { enableRealTimeUpdates: true, demoMode: true, ...config };
    
    // Initialize services
    this.redisService = new RedisService(config.redis);
    this.qodoService = new QodoService(config.qodo);
    this.mockScraper = createMockApifyScraper();
  }

  /**
   * Initialize all services and connections
   */
  async initialize(): Promise<void> {
    console.log('[Integration] Initializing orchestrator...');
    
    try {
      // Connect to Redis
      await this.redisService.connect();
      console.log('[Integration] ✅ Redis connected');

      // Test Qodo connection
      const qodoHealthy = await this.qodoService.healthCheck();
      console.log(`[Integration] ${qodoHealthy ? '✅' : '⚠️'} Qodo ${qodoHealthy ? 'connected' : 'connection issues'}`);

      this.emit('initialized');
      console.log('[Integration] 🚀 Orchestrator initialized successfully');
    } catch (error) {
      console.error('[Integration] ❌ Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start the end-to-end data processing pipeline
   */
  async startPipeline(): Promise<void> {
    if (this.isRunning) {
      console.log('[Integration] Pipeline already running');
      return;
    }

    this.isRunning = true;
    console.log('[Integration] 🚀 Starting end-to-end pipeline...');

    try {
      // Step 1: Collect data from Apify (mock)
      const scrapedData = await this.collectData();
      console.log(`[Integration] 📥 Collected ${scrapedData.length} regulations`);

      // Step 2: Process each regulation through the pipeline
      for (const data of scrapedData) {
        await this.processRegulation(data);
      }

      this.emit('pipelineComplete', { processedCount: scrapedData.length });
      console.log('[Integration] ✅ Pipeline completed successfully');
    } catch (error) {
      console.error('[Integration] ❌ Pipeline failed:', error);
      this.emit('error', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single regulation through the complete workflow
   */
  async processRegulation(scrapedData: ApifyScrapedData): Promise<Regulation> {
    const workflowId = `workflow_${scrapedData.id}`;
    
    try {
      // Create workflow state
      const workflowState: WorkflowState = {
        regulationId: scrapedData.id,
        currentStep: 'data_validation',
        status: 'processing',
        startedAt: new Date(),
        retryCount: 0
      };

      console.log(`[Integration] 🔄 Processing regulation: ${scrapedData.title}`);

      // Step 1: Store raw data in Redis
      const regulation = await this.storeRegulation(scrapedData);
      workflowState.currentStep = 'ai_analysis';

      // Step 2: Analyze with Qodo AI
      const analysisResult = await this.qodoService.analyzeRegulation(
        regulation.fullText, 
        regulation.title
      );

      // Step 3: Update regulation with AI insights
      const enrichedRegulation: Regulation = {
        ...regulation,
        summary: analysisResult.summary,
        riskScore: analysisResult.riskScore,
        priority: analysisResult.priority,
        insights: {
          whatChanged: analysisResult.insights.whatChanged,
          whoImpacted: analysisResult.insights.whoImpacted,
          requiredActions: analysisResult.insights.requiredActions
        },
        complianceChecklist: analysisResult.complianceChecklist,
        status: 'analyzed'
      };

      // Step 4: Update in Redis with AI results
      await this.redisService.storage.saveRegulation(enrichedRegulation);
      
      // Step 5: Track the change
      await this.redisService.changeTracker.recordChange(regulation.id, 'analyzed', {
        riskScore: analysisResult.riskScore,
        priority: analysisResult.priority
      });

      // Complete workflow
      workflowState.status = 'completed';
      workflowState.completedAt = new Date();
      workflowState.currentStep = 'completed';

      // Emit events for real-time updates
      this.emit('regulationProcessed', enrichedRegulation);
      
      if (enrichedRegulation.priority === 'high' || enrichedRegulation.priority === 'critical') {
        this.emit('highPriorityRegulation', enrichedRegulation);
      }

      console.log(`[Integration] ✅ Completed processing: ${regulation.title} (Risk: ${analysisResult.riskScore})`);
      return enrichedRegulation;

    } catch (error) {
      console.error(`[Integration] ❌ Failed to process regulation ${scrapedData.id}:`, error);
      this.emit('processingError', { regulationId: scrapedData.id, error });
      throw error;
    }
  }

  /**
   * Collect data from Apify mock scraper
   */
  private async collectData(): Promise<ApifyScrapedData[]> {
    console.log('[Integration] 📡 Collecting regulatory data...');
    
    if (this.config.demoMode) {
      // Use demo scenario data for hackathon
      const { DemoScenarioGenerator } = await import('./demo-scenario');
      const scenario = DemoScenarioGenerator.getScenario('hackathon');
      return scenario.regulations;
    } else {
      // Use mock scraper for realistic simulation
      const result = await this.mockScraper.runWithRetry();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(`Scraping failed: ${result.error}`);
      }
    }
  }

  /**
   * Store regulation data in Redis
   */
  private async storeRegulation(scrapedData: ApifyScrapedData): Promise<Regulation> {
    const regulation: Regulation = {
      id: scrapedData.id,
      title: scrapedData.title,
      date: new Date(scrapedData.date),
      url: scrapedData.url,
      fullText: scrapedData.fullText,
      source: scrapedData.source,
      scrapedAt: new Date(scrapedData.scrapedAt),
      hash: this.generateHash(scrapedData.fullText),
      status: 'new'
    };

    // Check for duplicates
    const existingId = await this.redisService.storage.isDuplicate(regulation);
    if (existingId) {
      console.log(`[Integration] ⚠️ Duplicate regulation detected: ${regulation.title}`);
      return regulation;
    }

    // Save to Redis
    await this.redisService.storage.saveRegulation(regulation);
    console.log(`[Integration] 💾 Stored regulation: ${regulation.title}`);

    return regulation;
  }

  /**
   * Generate hash for duplicate detection
   */
  private generateHash(text: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Get all processed regulations for dashboard
   */
  async getRegulations(limit: number = 50): Promise<Regulation[]> {
    return await this.redisService.storage.getAllRegulations({ limit });
  }

  /**
   * Get high priority regulations
   */
  async getHighPriorityRegulations(): Promise<Regulation[]> {
    const allRegulations = await this.getRegulations();
    return allRegulations.filter(reg => 
      reg.priority === 'high' || reg.priority === 'critical'
    );
  }

  /**
   * Get regulation by ID
   */
  async getRegulation(id: string): Promise<Regulation | null> {
    return await this.redisService.storage.getRegulation(id);
  }

  /**
   * Shutdown orchestrator and cleanup connections
   */
  async shutdown(): Promise<void> {
    console.log('[Integration] 🛑 Shutting down orchestrator...');
    this.isRunning = false;
    
    try {
      await this.redisService.disconnect();
      console.log('[Integration] ✅ Orchestrator shutdown complete');
    } catch (error) {
      console.error('[Integration] ❌ Shutdown error:', error);
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{ redis: boolean; qodo: boolean; overall: boolean }> {
    try {
      const redisHealth = await this.redisService.ping() === 'PONG';
      const qodoHealth = await this.qodoService.healthCheck();
      
      return {
        redis: redisHealth,
        qodo: qodoHealth,
        overall: redisHealth && qodoHealth
      };
    } catch (error) {
      return {
        redis: false,
        qodo: false,
        overall: false
      };
    }
  }
}