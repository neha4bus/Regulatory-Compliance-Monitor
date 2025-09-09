/**
 * Change tracking and timeline functionality
 */

import { RedisConnection } from './config';
import { Regulation } from '../../types/models';

export interface TimelineEntry {
  regulationId: string;
  timestamp: number;
  date: Date;
  regulation?: Regulation;
}

export interface ChangeEvent {
  id: string;
  regulationId: string;
  changeType: 'created' | 'updated' | 'status_changed' | 'analyzed';
  timestamp: number;
  date: Date;
  details: Record<string, any>;
}

export class ChangeTracker {
  private redis: RedisConnection;

  constructor(redis: RedisConnection) {
    this.redis = redis;
  }

  /**
   * Record a change event
   */
  async recordChange(
    regulationId: string,
    changeType: ChangeEvent['changeType'],
    details: Record<string, any> = {}
  ): Promise<void> {
    const client = this.redis.getClient();
    const timestamp = Date.now();
    const changeId = `${regulationId}_${changeType}_${timestamp}`;

    const changeEvent: ChangeEvent = {
      id: changeId,
      regulationId,
      changeType,
      timestamp,
      date: new Date(timestamp),
      details,
    };

    // Store change event
    const changeKey = `change:${changeId}`;
    await client.hSet(changeKey, {
      id: changeEvent.id,
      regulationId: changeEvent.regulationId,
      changeType: changeEvent.changeType,
      timestamp: changeEvent.timestamp.toString(),
      date: changeEvent.date.toISOString(),
      details: JSON.stringify(details),
    });

    // Add to timeline
    await client.zAdd('changes_timeline', {
      score: timestamp,
      value: changeId,
    });

    // Add to regulation-specific timeline
    const regulationTimelineKey = `regulation_timeline:${regulationId}`;
    await client.zAdd(regulationTimelineKey, {
      score: timestamp,
      value: changeId,
    });
  }

  /**
   * Get timeline entries for a specific time range
   */
  async getTimeline(options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
  }): Promise<TimelineEntry[]> {
    const client = this.redis.getClient();
    const startTime = options?.startTime || 0;
    const endTime = options?.endTime || Date.now();
    const limit = options?.limit || 100;

    // Get all regulation IDs from timeline and filter by time range
    const allEntries = await client.zRangeWithScores('changes_timeline', 0, -1);
    
    const timeline: TimelineEntry[] = [];
    
    for (const entry of allEntries) {
      const regulationId = entry.value;
      const timestamp = entry.score;
      
      // Skip if this is a change event ID (contains underscores)
      if (regulationId.includes('_')) {
        continue;
      }

      // Filter by time range
      if (timestamp >= startTime && timestamp <= endTime) {
        timeline.push({
          regulationId,
          timestamp,
          date: new Date(timestamp),
        });
      }
    }

    // Sort by timestamp (newest first) and apply limit
    timeline.sort((a, b) => b.timestamp - a.timestamp);
    
    const offset = options?.offset || 0;
    return timeline.slice(offset, offset + limit);
  }

  /**
   * Get change history for a specific regulation
   */
  async getRegulationHistory(regulationId: string): Promise<ChangeEvent[]> {
    const client = this.redis.getClient();
    const timelineKey = `regulation_timeline:${regulationId}`;
    
    // Get change event IDs for this regulation (newest first)
    const changeEntries = await client.zRangeWithScores(timelineKey, 0, -1);
    changeEntries.reverse(); // Newest first
    
    const changes: ChangeEvent[] = [];
    
    for (const entry of changeEntries) {
      const changeId = entry.value;
      const changeKey = `change:${changeId}`;
      const changeData = await client.hGetAll(changeKey);
      
      if (changeData && Object.keys(changeData).length > 0) {
        changes.push({
          ...changeData,
          timestamp: parseInt(changeData.timestamp),
          date: new Date(changeData.date),
          details: JSON.parse(changeData.details || '{}'),
        } as ChangeEvent);
      }
    }
    
    return changes;
  }

  /**
   * Get recent changes (last N changes)
   */
  async getRecentChanges(limit: number = 50): Promise<ChangeEvent[]> {
    const client = this.redis.getClient();
    
    // Get all entries from timeline and filter for change events
    const allEntries = await client.zRangeWithScores('changes_timeline', 0, -1);
    allEntries.reverse(); // Newest first
    
    const changes: ChangeEvent[] = [];
    
    for (const entry of allEntries) {
      const changeId = entry.value;
      
      // Skip regulation IDs (they don't contain underscores in the expected format)
      if (!changeId.includes('_')) {
        continue;
      }

      const changeKey = `change:${changeId}`;
      const changeData = await client.hGetAll(changeKey);
      
      if (changeData && Object.keys(changeData).length > 0) {
        changes.push({
          ...changeData,
          timestamp: parseInt(changeData.timestamp),
          date: new Date(changeData.date),
          details: JSON.parse(changeData.details || '{}'),
        } as ChangeEvent);
        
        if (changes.length >= limit) {
          break;
        }
      }
    }
    
    return changes;
  }

  /**
   * Get changes by type
   */
  async getChangesByType(changeType: ChangeEvent['changeType']): Promise<ChangeEvent[]> {
    const client = this.redis.getClient();
    
    // Get all change keys
    const changeKeys = await client.keys('change:*');
    const changes: ChangeEvent[] = [];
    
    for (const changeKey of changeKeys) {
      const changeData = await client.hGetAll(changeKey);
      
      if (changeData && changeData.changeType === changeType) {
        changes.push({
          ...changeData,
          timestamp: parseInt(changeData.timestamp),
          date: new Date(changeData.date),
          details: JSON.parse(changeData.details || '{}'),
        } as ChangeEvent);
      }
    }
    
    // Sort by timestamp (newest first)
    changes.sort((a, b) => b.timestamp - a.timestamp);
    
    return changes;
  }

  /**
   * Clean up old timeline entries
   */
  async cleanupOldEntries(olderThanDays: number = 90): Promise<number> {
    const client = this.redis.getClient();
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Remove old entries from main timeline
    const removedFromTimeline = await client.zRemRangeByScore('changes_timeline', 0, cutoffTime);
    
    // Clean up individual change records
    const changeKeys = await client.keys('change:*');
    let removedChanges = 0;
    
    for (const changeKey of changeKeys) {
      const timestamp = await client.hGet(changeKey, 'timestamp');
      if (timestamp && parseInt(timestamp) < cutoffTime) {
        await client.del(changeKey);
        removedChanges++;
      }
    }
    
    // Clean up regulation-specific timelines
    const regulationTimelineKeys = await client.keys('regulation_timeline:*');
    for (const timelineKey of regulationTimelineKeys) {
      await client.zRemRangeByScore(timelineKey, 0, cutoffTime);
    }
    
    return removedFromTimeline + removedChanges;
  }
}