/**
 * Integration Module - Main Export
 * Provides end-to-end integration of all components
 */

export { IntegrationOrchestrator } from './orchestrator';
export { DemoScenarioGenerator } from './demo-scenario';
export { RealTimeUpdateManager } from './realtime-updates';

import { IntegrationOrchestrator } from './orchestrator';
import { DemoScenarioGenerator } from './demo-scenario';
import { RealTimeUpdateManager } from './realtime-updates';
import { Regulation } from '../types';

/**
 * Main Integration Service
 * Combines orchestrator, demo scenarios, and real-time updates
 */
export class IntegrationService {
  private orchestrator: IntegrationOrchestrator;
  private updateManager: RealTimeUpdateManager;
  private isInitialized: boolean = false;

  constructor(config: any = {}) {
    this.orchestrator = new IntegrationOrchestrator(config);
    this.updateManager = new RealTimeUpdateManager();
    
    // Connect orchestrator events to update manager
    this.setupEventBridge();
  }

  /**
   * Bridge events between orchestrator and update manager
   */
  private setupEventBridge(): void {
    // Forward orchestrator events to update manager
    this.orchestrator.on('regulationProcessed', (regulation: Regulation) => {
      this.updateManager.emit('regulation_processed', regulation);
    });

    this.orchestrator.on('highPriorityRegulation', (regulation: Regulation) => {
      this.updateManager.emit('high_priority_alert', regulation);
    });

    this.orchestrator.on('error', (error: any) => {
      console.error('[Integration] Orchestrator error:', error);
    });

    // Forward update manager events
    this.updateManager.on('dashboard_update', (update: any) => {
      console.log('[Integration] Dashboard update:', update.type);
    });
  }

  /**
   * Initialize the complete integration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Integration] Service already initialized');
      return;
    }

    console.log('[Integration] 🚀 Initializing complete integration system...');

    try {
      // Initialize orchestrator
      await this.orchestrator.initialize();
      
      this.isInitialized = true;
      console.log('[Integration] ✅ Integration service initialized successfully');
    } catch (error) {
      console.error('[Integration] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run a complete demo scenario
   */
  async runDemoScenario(scenarioType: 'hackathon' | 'quick' = 'hackathon'): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Integration service not initialized');
    }

    console.log(`[Integration] 🎬 Running ${scenarioType} demo scenario...`);

    try {
      // Get demo scenario
      const scenario = DemoScenarioGenerator.getScenario(scenarioType);
      console.log(`[Integration] 📋 Loaded scenario: ${scenario.name}`);
      console.log(`[Integration] 📊 Expected outcomes: ${scenario.expectedOutcomes.highPriorityCount} high priority, ${scenario.expectedOutcomes.totalActionItems} action items`);

      // Process each regulation in the scenario
      const processedRegulations: Regulation[] = [];
      
      for (let i = 0; i < scenario.regulations.length; i++) {
        const scrapedData = scenario.regulations[i];
        console.log(`[Integration] 🔄 Processing regulation ${i + 1}/${scenario.regulations.length}: ${scrapedData.title}`);
        
        try {
          const regulation = await this.orchestrator.processRegulation(scrapedData);
          processedRegulations.push(regulation);
          
          // Add delay between regulations for demo effect
          if (i < scenario.regulations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`[Integration] ❌ Failed to process regulation ${scrapedData.id}:`, error);
        }
      }

      // Generate summary
      const highPriorityCount = processedRegulations.filter(reg => 
        reg.priority === 'high' || reg.priority === 'critical'
      ).length;

      const totalActionItems = processedRegulations.reduce((total, reg) => 
        total + (reg.complianceChecklist?.length || 0), 0
      );

      console.log('[Integration] 📊 Demo scenario completed:');
      console.log(`  - Processed: ${processedRegulations.length} regulations`);
      console.log(`  - High priority: ${highPriorityCount} regulations`);
      console.log(`  - Total action items: ${totalActionItems}`);
      console.log(`  - Affected operations: ${scenario.expectedOutcomes.affectedOperations.join(', ')}`);

    } catch (error) {
      console.error('[Integration] ❌ Demo scenario failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time demo updates
   */
  async startRealTimeDemo(): Promise<void> {
    console.log('[Integration] 📡 Starting real-time demo updates...');
    
    // Get current regulations
    const regulations = await this.orchestrator.getRegulations(10);
    
    // Start demo updates
    this.updateManager.startDemoUpdates(regulations);
    
    // Register a demo client
    this.updateManager.registerClient('demo-dashboard');
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<any> {
    const orchestratorHealth = await this.orchestrator.healthCheck();
    const updateStats = this.updateManager.getUpdateStats();
    
    return {
      orchestrator: orchestratorHealth,
      realTimeUpdates: updateStats,
      initialized: this.isInitialized,
      timestamp: new Date()
    };
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<any> {
    const regulations = await this.orchestrator.getRegulations(20);
    const highPriorityRegulations = await this.orchestrator.getHighPriorityRegulations();
    
    return await this.updateManager.getCurrentDashboardState(regulations);
  }

  /**
   * Get regulation by ID
   */
  async getRegulation(id: string): Promise<Regulation | null> {
    return await this.orchestrator.getRegulation(id);
  }

  /**
   * Shutdown the integration service
   */
  async shutdown(): Promise<void> {
    console.log('[Integration] 🛑 Shutting down integration service...');
    
    try {
      await this.orchestrator.shutdown();
      this.updateManager.shutdown();
      
      this.isInitialized = false;
      console.log('[Integration] ✅ Integration service shutdown complete');
    } catch (error) {
      console.error('[Integration] ❌ Shutdown error:', error);
    }
  }
}

/**
 * Create and export a default integration service instance
 */
export const createIntegrationService = (config: any = {}) => {
  return new IntegrationService(config);
};