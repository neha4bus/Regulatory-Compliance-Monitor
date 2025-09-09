/**
 * Basic functionality test for Qodo AI Analysis
 */

import { QodoService } from './index';

async function testBasicFunctionality() {
  console.log('🧪 Testing Qodo AI Analysis Basic Functionality\n');
  
  const qodoService = new QodoService();
  
  const testText = `
    URGENT: New emission monitoring requirements for offshore drilling operations.
    All operators must install certified monitoring equipment within 90 days.
    Monthly reports must be submitted to EPA starting January 1, 2025.
    Violations may result in fines up to $50,000 per day.
  `;
  
  try {
    console.log('📊 Running analysis...');
    const result = await qodoService.analyzeRegulation(testText, 'Emission Monitoring Update');
    
    console.log('✅ Analysis completed successfully!');
    console.log('\n📋 Results Summary:');
    console.log(`- Risk Score: ${result.priorityMetrics.riskScore}`);
    console.log(`- Priority: ${result.priorityMetrics.priority}`);
    console.log(`- Processing Time: ${result.processingTime}ms`);
    console.log(`- Confidence: ${result.confidence}`);
    console.log(`- Errors: ${result.errors.length}`);
    
    console.log('\n🔍 Analysis Details:');
    console.log(`- Summary: ${result.qodoResponse.summary.substring(0, 100)}...`);
    console.log(`- What Changed: ${result.extractedInsights.whatChanged}`);
    console.log(`- Who Impacted: ${result.extractedInsights.whoImpacted.join(', ')}`);
    console.log(`- Required Actions: ${result.extractedInsights.requiredActions.length} actions`);
    console.log(`- Checklist Items: ${result.complianceChecklist.totalItems} items`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach((error: string) => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 Basic functionality test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testBasicFunctionality()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testBasicFunctionality };