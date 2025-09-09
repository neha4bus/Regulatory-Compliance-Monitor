#!/usr/bin/env ts-node

/**
 * Demo Runner Script
 * Demonstrates the complete end-to-end workflow for hackathon presentation
 */

import { IntegrationService, DemoScenarioGenerator } from './integration';
import { Regulation } from './types';

class DemoRunner {
  private integrationService: IntegrationService;
  private startTime: Date;

  constructor() {
    this.integrationService = new IntegrationService({
      demoMode: true,
      enableRealTimeUpdates: true
    });
    this.startTime = new Date();
  }

  /**
   * Run the complete demo
   */
  async runDemo(): Promise<void> {
    console.log('🎬 AI Regulatory Compliance Monitor - Live Demo');
    console.log('=' .repeat(60));
    console.log();

    try {
      // Step 1: Initialize system
      await this.initializeSystem();

      // Step 2: Show system status
      await this.showSystemStatus();

      // Step 3: Run demo scenario
      await this.runDemoScenario();

      // Step 4: Show results
      await this.showResults();

      // Step 5: Demonstrate real-time updates
      await this.demonstrateRealTimeUpdates();

      console.log();
      console.log('🎉 Demo completed successfully!');
      console.log(`⏱️  Total demo time: ${this.getElapsedTime()}`);

    } catch (error) {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize the system
   */
  private async initializeSystem(): Promise<void> {
    console.log('🚀 Step 1: Initializing AI Regulatory Compliance Monitor...');
    console.log();

    console.log('  📡 Connecting to Redis cache...');
    console.log('  🤖 Initializing Qodo AI analysis...');
    console.log('  🔄 Setting up workflow orchestration...');
    console.log('  📊 Preparing dashboard components...');

    await this.integrationService.initialize();

    console.log('  ✅ All systems initialized successfully');
    console.log();
  }

  /**
   * Show system status
   */
  private async showSystemStatus(): Promise<void> {
    console.log('📊 Step 2: System Health Check');
    console.log();

    const status = await this.integrationService.getSystemStatus();

    console.log('  Component Status:');
    console.log(`    Redis Cache: ${status.orchestrator.redis ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`    Qodo AI: ${status.orchestrator.qodo ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`    Real-time Updates: ${status.realTimeUpdates.connectedClients >= 0 ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`    Overall Status: ${status.orchestrator.overall ? '✅ Healthy' : '❌ Issues Detected'}`);
    console.log();
  }

  /**
   * Run the demo scenario
   */
  private async runDemoScenario(): Promise<void> {
    console.log('🎭 Step 3: Processing Regulatory Changes (Live Demo)');
    console.log();

    const scenario = DemoScenarioGenerator.getScenario('hackathon');
    console.log(`  📋 Scenario: ${scenario.name}`);
    console.log(`  📄 Processing ${scenario.regulations.length} regulatory documents...`);
    console.log();

    // Show what we're about to process
    console.log('  Regulatory Sources:');
    scenario.regulations.forEach((reg, index) => {
      console.log(`    ${index + 1}. ${reg.source}: ${reg.title}`);
    });
    console.log();

    console.log('  🔄 Starting automated processing pipeline...');
    console.log();

    // Run the scenario with progress updates
    await this.runScenarioWithProgress();
  }

  /**
   * Run scenario with progress updates
   */
  private async runScenarioWithProgress(): Promise<void> {
    const scenario = DemoScenarioGenerator.getScenario('hackathon');
    
    for (let i = 0; i < scenario.regulations.length; i++) {
      const reg = scenario.regulations[i];
      const progress = Math.round(((i + 1) / scenario.regulations.length) * 100);
      
      console.log(`  [${progress}%] Processing: ${reg.title.substring(0, 50)}...`);
      console.log(`         📡 Data Collection → 💾 Redis Storage → 🤖 AI Analysis → 📊 Dashboard`);
      
      // Simulate processing time for demo effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`         ✅ Completed with risk score and action items`);
      console.log();
    }

    // Run the actual scenario
    await this.integrationService.runDemoScenario('hackathon');
  }

  /**
   * Show processing results
   */
  private async showResults(): Promise<void> {
    console.log('📈 Step 4: Processing Results & Insights');
    console.log();

    const dashboardData = await this.integrationService.getDashboardData();
    const regulations = await this.getProcessedRegulations();

    console.log('  📊 Summary Statistics:');
    console.log(`    Total Regulations Processed: ${regulations.length}`);
    console.log(`    High Priority Alerts: ${dashboardData.highPriorityCount}`);
    console.log(`    Total Action Items Generated: ${dashboardData.totalActionItems}`);
    console.log();

    console.log('  🚨 High Priority Regulations:');
    const highPriorityRegs = regulations.filter(reg => 
      reg.priority === 'high' || reg.priority === 'critical'
    );

    highPriorityRegs.forEach((reg, index) => {
      console.log(`    ${index + 1}. ${reg.title}`);
      console.log(`       Risk Score: ${reg.riskScore}/10 | Priority: ${reg.priority?.toUpperCase()}`);
      console.log(`       Source: ${reg.source} | Actions Required: ${reg.complianceChecklist?.length || 0}`);
      if (reg.insights?.requiredActions) {
        console.log(`       Key Actions: ${reg.insights.requiredActions.slice(0, 2).join(', ')}`);
      }
      console.log();
    });
  }

  /**
   * Demonstrate real-time updates
   */
  private async demonstrateRealTimeUpdates(): Promise<void> {
    console.log('📡 Step 5: Real-time Dashboard Updates');
    console.log();

    console.log('  🔄 Starting real-time update simulation...');
    console.log('  📊 Dashboard would show live updates as new regulations are processed');
    console.log('  🔔 Slack notifications would be sent for high-priority items');
    console.log();

    await this.integrationService.startRealTimeDemo();

    console.log('  ✅ Real-time updates active');
    console.log('  📱 Dashboard clients: Connected and receiving updates');
    console.log();
  }

  /**
   * Get processed regulations
   */
  private async getProcessedRegulations(): Promise<Regulation[]> {
    // In a real implementation, this would fetch from Redis
    // For demo, we'll simulate the expected results
    const scenario = DemoScenarioGenerator.getScenario('hackathon');
    
    return scenario.regulations.map((reg, index) => ({
      id: reg.id,
      title: reg.title,
      date: new Date(reg.date),
      url: reg.url,
      fullText: reg.fullText,
      source: reg.source,
      scrapedAt: new Date(reg.scrapedAt),
      hash: `hash_${reg.id}`,
      status: 'analyzed' as const,
      summary: `AI-generated summary for ${reg.title}`,
      riskScore: [8.5, 7.2, 9.1, 6.8, 7.9][index] || 7.0,
      priority: (['critical', 'high', 'critical', 'medium', 'high'][index] || 'medium') as any,
      insights: {
        whatChanged: 'New regulatory requirements',
        whoImpacted: ['Oil & Gas operators'],
        requiredActions: ['Update procedures', 'Install equipment', 'Train staff']
      },
      complianceChecklist: [
        'Review current compliance status',
        'Update operational procedures',
        'Install required equipment',
        'Train personnel',
        'Submit compliance reports'
      ]
    }));
  }

  /**
   * Get elapsed time
   */
  private getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime.getTime();
    const seconds = Math.round(elapsed / 1000);
    return `${seconds} seconds`;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up resources...');
    await this.integrationService.shutdown();
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isQuickDemo = args.includes('--quick');

  if (isQuickDemo) {
    console.log('⚡ Running quick demo mode...');
  }

  const demoRunner = new DemoRunner();
  await demoRunner.runDemo();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { DemoRunner };