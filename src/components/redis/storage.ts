/**
 * Redis storage utilities for regulations
 */

import { createHash } from 'crypto';
import { RedisConnection } from './config';
import { Regulation } from '../../types/models';

export class RegulationStorage {
  private redis: RedisConnection;

  constructor(redis: RedisConnection) {
    this.redis = redis;
  }

  /**
   * Generate hash for regulation content to detect duplicates
   */
  private generateHash(regulation: Omit<Regulation, 'hash'>): string {
    const content = `${regulation.title}|${regulation.url}|${regulation.fullText}|${regulation.source}`;
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Save a regulation to Redis
   */
  async saveRegulation(regulation: Omit<Regulation, 'hash'>): Promise<Regulation> {
    const client = this.redis.getClient();
    const hash = this.generateHash(regulation);
    const regulationWithHash: Regulation = { ...regulation, hash };

    // Store regulation data
    const regulationKey = `regulation:${regulation.id}`;
    const regulationData: Record<string, string> = {
      id: regulationWithHash.id,
      title: regulationWithHash.title,
      date: regulation.date.toISOString(),
      url: regulationWithHash.url,
      fullText: regulationWithHash.fullText,
      source: regulationWithHash.source,
      scrapedAt: regulation.scrapedAt.toISOString(),
      hash: regulationWithHash.hash,
      status: regulationWithHash.status,
    };

    // Add optional fields if they exist
    if (regulationWithHash.summary) {
      regulationData.summary = regulationWithHash.summary;
    }
    if (regulationWithHash.riskScore !== undefined) {
      regulationData.riskScore = regulationWithHash.riskScore.toString();
    }
    if (regulationWithHash.priority) {
      regulationData.priority = regulationWithHash.priority;
    }
    if (regulationWithHash.insights) {
      regulationData.insights = JSON.stringify(regulationWithHash.insights);
    }
    if (regulationWithHash.complianceChecklist) {
      regulationData.complianceChecklist = JSON.stringify(regulationWithHash.complianceChecklist);
    }
    if (regulationWithHash.assignedTo) {
      regulationData.assignedTo = regulationWithHash.assignedTo;
    }
    if (regulation.reviewedAt) {
      regulationData.reviewedAt = regulation.reviewedAt.toISOString();
    }

    await client.hSet(regulationKey, regulationData);

    // Store hash for duplicate detection
    const hashKey = `regulation_hash:${hash}`;
    await client.set(hashKey, regulation.id);

    // Add to timeline for change tracking
    const timestamp = Date.now();
    await client.zAdd('changes_timeline', {
      score: timestamp,
      value: regulation.id,
    });

    // Add to pending analysis queue if new
    if (regulation.status === 'new') {
      await client.lPush('pending_analysis', regulation.id);
    }

    return regulationWithHash;
  }

  /**
   * Retrieve a regulation by ID
   */
  async getRegulation(id: string): Promise<Regulation | null> {
    const client = this.redis.getClient();
    const regulationKey = `regulation:${id}`;
    
    const data = await client.hGetAll(regulationKey);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      ...data,
      date: new Date(data.date),
      scrapedAt: new Date(data.scrapedAt),
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
      riskScore: data.riskScore ? parseFloat(data.riskScore) : undefined,
      insights: data.insights ? JSON.parse(data.insights) : undefined,
      complianceChecklist: data.complianceChecklist ? JSON.parse(data.complianceChecklist) : undefined,
    } as Regulation;
  }

  /**
   * Update an existing regulation
   */
  async updateRegulation(id: string, updates: Partial<Regulation>): Promise<Regulation | null> {
    const existing = await this.getRegulation(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updates };
    return await this.saveRegulation(updated);
  }

  /**
   * Check if a regulation already exists based on content hash
   */
  async isDuplicate(regulation: Omit<Regulation, 'hash'>): Promise<string | null> {
    const client = this.redis.getClient();
    const hash = this.generateHash(regulation);
    const hashKey = `regulation_hash:${hash}`;
    
    const existingId = await client.get(hashKey);
    return existingId;
  }

  /**
   * Get all regulations with optional filtering
   */
  async getAllRegulations(options?: {
    status?: Regulation['status'];
    priority?: Regulation['priority'];
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<Regulation[]> {
    const client = this.redis.getClient();
    
    // Get all regulation keys
    const keys = await client.keys('regulation:*');
    
    if (keys.length === 0) {
      return [];
    }

    // Get all regulations
    const regulations: Regulation[] = [];
    for (const key of keys) {
      const id = key.replace('regulation:', '');
      const regulation = await this.getRegulation(id);
      if (regulation) {
        regulations.push(regulation);
      }
    }

    // Apply filters
    let filtered = regulations;
    if (options?.status) {
      filtered = filtered.filter(r => r.status === options.status);
    }
    if (options?.priority) {
      filtered = filtered.filter(r => r.priority === options.priority);
    }
    if (options?.source) {
      filtered = filtered.filter(r => r.source === options.source);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || filtered.length;
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Delete a regulation
   */
  async deleteRegulation(id: string): Promise<boolean> {
    const client = this.redis.getClient();
    const regulation = await this.getRegulation(id);
    
    if (!regulation) {
      return false;
    }

    // Remove regulation data
    const regulationKey = `regulation:${id}`;
    await client.del(regulationKey);

    // Remove hash mapping
    const hashKey = `regulation_hash:${regulation.hash}`;
    await client.del(hashKey);

    // Remove from timeline
    await client.zRem('changes_timeline', id);

    // Remove from pending analysis queue
    await client.lRem('pending_analysis', 0, id);

    return true;
  }

  /**
   * Get regulations count by status
   */
  async getRegulationCounts(): Promise<Record<string, number>> {
    const regulations = await this.getAllRegulations();
    const counts: Record<string, number> = {
      new: 0,
      analyzed: 0,
      reviewed: 0,
      archived: 0,
    };

    regulations.forEach(regulation => {
      counts[regulation.status] = (counts[regulation.status] || 0) + 1;
    });

    return counts;
  }
}