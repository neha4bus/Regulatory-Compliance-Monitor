/**
 * Example usage of Qodo AI Analysis Integration
 */

import { QodoService, QodoClient, QodoAnalysisPipeline } from './index';
import { QodoAnalysisRequest } from '../../types';

/**
 * Example: Basic regulation analysis
 */
export async function basicAnalysisExample(): Promise<void> {
  console.log('=== Basic Qodo Analysis Example ===');
  
  const qodoService = new QodoService();
  
  const regulationText = `
    New emission monitoring requirements for offshore drilling operations.
    All operators must install certified monitoring equipment within 90 days.
    Monthly reports must be submitted to EPA starting January 1, 2025.
    Violations may result in fines up to $50,000 per day.
  `;
  
  try {
    const result = await qodoService.analyzeRegulation(regulationText, 'Emission Monitoring Update');
    
    console.log('Analysis Results:');
    console.log('- Risk Score:', result.priorityMetrics.riskScore);
    console.log('- Priority:', result.priorityMetrics.priority);
    console.log('- Summary:', result.qodoResponse.summary);
    console.log('- What Changed:', result.extractedInsights.whatChanged);
    console.log('- Who Impacted:', result.extractedInsights.whoImpacted.join(', '));
    console.log('- Required Actions:', result.extractedInsights.requiredActions.length);
    console.log('- Checklist Items:', result.complianceChecklist.totalItems);
    console.log('- Processing Time:', result.processingTime, 'ms');
    console.log('- Confidence:', result.confidence);
    
    if (result.errors.length > 0) {
      console.log('- Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

/**
 * Example: Direct API client usage
 */
export async function directClientExample(): Promise<void> {
  console.log('=== Direct Qodo Client Example ===');
  
  const client = new QodoClient();
  
  const request: QodoAnalysisRequest = {
    text: 'Safety training requirements for all offshore personnel.',
    analysis_type: 'regulatory_compliance',
    industry: 'oil_and_gas',
    output_format: {
      summary: true,
      risk_score: true,
      action_items: true,
      affected_parties: true,
    },
  };
  
  try {
    const response = await client.analyzeText(request);
    
    console.log('Qodo API Response:');
    console.log('- Summary:', response.summary);
    console.log('- Risk Score:', response.risk_score);
    console.log('- Priority:', response.priority);
    console.log('- Insights:', response.insights);
    console.log('- Checklist:', response.compliance_checklist);
    
  } catch (error) {
    console.error('API call failed:', error);
  }
}

/**
 * Example: Batch analysis of multiple regulations
 */
export async function batchAnalysisExample(): Promise<void> {
  console.log('=== Batch Analysis Example ===');
  
  const qodoService = new QodoService();
  
  const regulations = [
    {
      text: 'New safety protocols for drilling operations.',
      title: 'Safety Protocol Update',
      metadata: { source: 'EPA', date: '2025-01-01' },
    },
    {
      text: 'Environmental monitoring requirements for refineries.',
      title: 'Environmental Standards',
      metadata: { source: 'DOE', date: '2025-01-02' },
    },
    {
      text: 'Pipeline inspection frequency increased to quarterly.',
      title: 'Pipeline Inspection Update',
      metadata: { source: 'PHMSA', date: '2025-01-03' },
    },
  ];
  
  try {
    const results = await qodoService.pipeline.analyzeBatch(regulations);
    
    console.log(`Batch Analysis Results: ${results.length} regulations processed`);
    
    results.forEach((result, index) => {
      console.log(`\nRegulation ${index + 1}:`);
      console.log('- Title:', result.regulation.title);
      console.log('- Risk Score:', result.priorityMetrics.riskScore);
      console.log('- Priority:', result.priorityMetrics.priority);
      console.log('- Checklist Items:', result.complianceChecklist.totalItems);
      console.log('- Processing Time:', result.processingTime, 'ms');
      
      if (result.errors.length > 0) {
        console.log('- Errors:', result.errors.length);
      }
    });
    
  } catch (error) {
    console.error('Batch analysis failed:', error);
  }
}

/**
 * Example: Custom pipeline configuration
 */
export async function customPipelineExample(): Promise<void> {
  console.log('=== Custom Pipeline Example ===');
  
  const qodoService = new QodoService();
  
  const text = 'Urgent compliance requirements for all operators.';
  
  // Custom options - skip Qodo API, focus on local analysis
  const options = {
    includeQodoAPI: false,
    generateChecklist: true,
    extractInsights: true,
    calculateRisk: true,
    timeout: 30000,
  };
  
  try {
    const result = await qodoService.pipeline.analyze(text, 'Urgent Compliance', undefined, options);
    
    console.log('Custom Pipeline Results:');
    console.log('- Used Qodo API:', options.includeQodoAPI);
    console.log('- Risk Score:', result.priorityMetrics.riskScore);
    console.log('- Insights Extracted:', result.extractedInsights.requiredActions.length, 'actions');
    console.log('- Checklist Generated:', result.complianceChecklist.totalItems, 'items');
    console.log('- Processing Time:', result.processingTime, 'ms');
    
  } catch (error) {
    console.error('Custom pipeline failed:', error);
  }
}

/**
 * Example: Health check and service status
 */
export async function healthCheckExample(): Promise<void> {
  console.log('=== Health Check Example ===');
  
  const qodoService = new QodoService();
  
  try {
    const isHealthy = await qodoService.healthCheck();
    console.log('Qodo Service Health:', isHealthy ? 'Healthy' : 'Unhealthy');
    
    // Test individual components
    console.log('Components initialized:');
    console.log('- Risk Scorer:', !!qodoService.riskScorer);
    console.log('- Insight Extractor:', !!qodoService.insightExtractor);
    console.log('- Checklist Generator:', !!qodoService.checklistGenerator);
    console.log('- Analysis Pipeline:', !!qodoService.pipeline);
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

/**
 * Example: Error handling and resilience
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('=== Error Handling Example ===');
  
  const qodoService = new QodoService();
  
  // Test with various problematic inputs
  const testCases = [
    { name: 'Empty text', text: '' },
    { name: 'Very short text', text: 'Rule.' },
    { name: 'Non-regulatory text', text: 'Lorem ipsum dolor sit amet.' },
    { name: 'Very long text', text: 'A'.repeat(50000) },
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      const result = await qodoService.analyzeRegulation(testCase.text);
      
      console.log('- Success: Analysis completed');
      console.log('- Risk Score:', result.priorityMetrics.riskScore);
      console.log('- Confidence:', result.confidence);
      console.log('- Errors:', result.errors.length);
      
    } catch (error) {
      console.log('- Failed:', error.message);
    }
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Qodo AI Analysis Examples\n');
  
  try {
    await basicAnalysisExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await directClientExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await batchAnalysisExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await customPipelineExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await healthCheckExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingExample();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for direct execution
if (require.main === module) {
  runAllExamples().catch(console.error);
}