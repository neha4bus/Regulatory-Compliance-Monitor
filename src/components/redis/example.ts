/**
 * Example usage of Redis data layer
 */

import { RedisService } from './index';
import { Regulation } from '../../types/models';

export async function demonstrateRedisUsage(): Promise<void> {
  const redis = new RedisService();
  
  try {
    // Connect to Redis
    await redis.connect();
    console.log('Connected to Redis');

    // Create a sample regulation
    const sampleRegulation: Omit<Regulation, 'hash'> = {
      id: 'demo-reg-001',
      title: 'New EPA Emission Standards for Oil & Gas Operations',
      date: new Date('2025-03-01'),
      url: 'https://www.epa.gov/regulations/demo-reg-001',
      fullText: 'This regulation establishes new emission standards for oil and gas operations...',
      source: 'EPA',
      scrapedAt: new Date(),
      status: 'new',
    };

    // Check for duplicates
    const existingId = await redis.storage.isDuplicate(sampleRegulation);
    if (existingId) {
      console.log(`Duplicate found: ${existingId}`);
      return;
    }

    // Save the regulation
    const savedRegulation = await redis.storage.saveRegulation(sampleRegulation);
    console.log(`Saved regulation: ${savedRegulation.id} with hash: ${savedRegulation.hash}`);

    // Record a change event
    await redis.changeTracker.recordChange(
      savedRegulation.id,
      'created',
      { source: 'demo', action: 'initial_creation' }
    );

    // Update the regulation with AI analysis results
    const updatedRegulation = await redis.storage.updateRegulation(savedRegulation.id, {
      status: 'analyzed',
      riskScore: 8.5,
      priority: 'high',
      summary: 'New emission standards requiring immediate compliance actions',
      insights: {
        whatChanged: 'Emission limits reduced by 30%',
        whoImpacted: ['Offshore drilling operations', 'Onshore production facilities'],
        requiredActions: ['Update monitoring equipment', 'Revise operational procedures'],
      },
      complianceChecklist: [
        'Install new emission monitoring systems',
        'Train staff on new procedures',
        'Update environmental management plans',
      ],
    });

    if (updatedRegulation) {
      console.log(`Updated regulation status: ${updatedRegulation.status}`);
      
      // Record the analysis completion
      await redis.changeTracker.recordChange(
        updatedRegulation.id,
        'analyzed',
        { 
          riskScore: updatedRegulation.riskScore,
          priority: updatedRegulation.priority,
        }
      );
    }

    // Retrieve all regulations
    const allRegulations = await redis.storage.getAllRegulations({ limit: 10 });
    console.log(`Total regulations: ${allRegulations.length}`);

    // Get regulation counts by status
    const counts = await redis.storage.getRegulationCounts();
    console.log('Regulation counts by status:', counts);

    // Get recent changes
    const recentChanges = await redis.changeTracker.getRecentChanges(5);
    console.log(`Recent changes: ${recentChanges.length}`);

    // Get regulation history
    const history = await redis.changeTracker.getRegulationHistory(savedRegulation.id);
    console.log(`History entries for ${savedRegulation.id}: ${history.length}`);

    // Get timeline
    const timeline = await redis.changeTracker.getTimeline({ limit: 10 });
    console.log(`Timeline entries: ${timeline.length}`);

    console.log('Redis demonstration completed successfully');

  } catch (error) {
    console.error('Redis demonstration failed:', error);
  } finally {
    await redis.disconnect();
    console.log('Disconnected from Redis');
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateRedisUsage().catch(console.error);
}