#!/usr/bin/env node

/**
 * Redis Storage Tool for Senso MCP
 * Handles Redis operations for regulations and action items
 */

const redis = require('redis');

class RedisStorageTool {
  constructor() {
    this.client = null;
  }

  /**
   * Connect to Redis
   */
  async connect() {
    if (this.client) {
      return;
    }

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0
      });

      await this.client.connect();
      console.log('[RedisStorage] ✅ Connected to Redis');
    } catch (error) {
      console.error('[RedisStorage] ❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      console.log('[RedisStorage] Disconnected from Redis');
    }
  }

  /**
   * Save regulation to Redis
   */
  async saveRegulation(regulation) {
    await this.connect();

    try {
      console.log(`[RedisStorage] Saving regulation: ${regulation.id}`);

      // Generate hash for duplicate detection
      const crypto = require('crypto');
      const hash = crypto.createHash('md5')
        .update(`${regulation.title}|${regulation.url}|${regulation.fullText}`)
        .digest('hex');

      // Check for duplicates
      const existingId = await this.client.get(`regulation_hash:${hash}`);
      if (existingId && existingId !== regulation.id) {
        console.log(`[RedisStorage] ⚠️ Duplicate detected: ${regulation.id} matches ${existingId}`);
        return {
          success: true,
          duplicate: true,
          existingId,
          message: 'Regulation already exists'
        };
      }

      // Prepare regulation data
      const regulationData = {
        id: regulation.id,
        title: regulation.title,
        date: regulation.date,
        url: regulation.url,
        fullText: regulation.fullText,
        source: regulation.source,
        scrapedAt: regulation.scrapedAt,
        hash: hash,
        status: regulation.status || 'new',
        createdAt: new Date().toISOString()
      };

      // Add AI analysis results if present
      if (regulation.summary) regulationData.summary = regulation.summary;
      if (regulation.riskScore) regulationData.riskScore = regulation.riskScore.toString();
      if (regulation.priority) regulationData.priority = regulation.priority;
      if (regulation.insights) regulationData.insights = JSON.stringify(regulation.insights);
      if (regulation.complianceChecklist) regulationData.complianceChecklist = JSON.stringify(regulation.complianceChecklist);

      // Store regulation
      const regulationKey = `regulation:${regulation.id}`;
      await this.client.hSet(regulationKey, regulationData);

      // Store hash for duplicate detection
      await this.client.set(`regulation_hash:${hash}`, regulation.id);

      // Add to timeline
      await this.client.zAdd('changes_timeline', {
        score: Date.now(),
        value: regulation.id
      });

      // Add to pending analysis queue if new
      if (regulationData.status === 'new') {
        await this.client.lPush('pending_analysis', regulation.id);
      }

      console.log(`[RedisStorage] ✅ Saved regulation: ${regulation.id}`);

      return {
        success: true,
        duplicate: false,
        regulationId: regulation.id,
        hash: hash
      };

    } catch (error) {
      console.error(`[RedisStorage] ❌ Failed to save regulation ${regulation.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Get regulation from Redis
   */
  async getRegulation(regulationId) {
    await this.connect();

    try {
      console.log(`[RedisStorage] Retrieving regulation: ${regulationId}`);

      const regulationKey = `regulation:${regulationId}`;
      const data = await this.client.hGetAll(regulationKey);

      if (!data || Object.keys(data).length === 0) {
        return {
          success: false,
          error: 'Regulation not found'
        };
      }

      // Parse the data
      const regulation = {
        ...data,
        riskScore: data.riskScore ? parseFloat(data.riskScore) : undefined,
        insights: data.insights ? JSON.parse(data.insights) : undefined,
        complianceChecklist: data.complianceChecklist ? JSON.parse(data.complianceChecklist) : undefined
      };

      console.log(`[RedisStorage] ✅ Retrieved regulation: ${regulationId}`);

      return {
        success: true,
        regulation
      };

    } catch (error) {
      console.error(`[RedisStorage] ❌ Failed to get regulation ${regulationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update regulation with AI analysis results
   */
  async updateRegulation(regulationId, updates) {
    await this.connect();

    try {
      console.log(`[RedisStorage] Updating regulation: ${regulationId}`);

      // Get existing regulation
      const existing = await this.getRegulation(regulationId);
      if (!existing.success) {
        return existing;
      }

      // Merge updates
      const updatedData = { ...existing.regulation, ...updates };
      updatedData.updatedAt = new Date().toISOString();

      // Save updated regulation
      const result = await this.saveRegulation(updatedData);

      // Record change in timeline
      if (updates.status) {
        await this.client.zAdd('changes_timeline', {
          score: Date.now(),
          value: `${regulationId}_status_${updates.status}`
        });
      }

      console.log(`[RedisStorage] ✅ Updated regulation: ${regulationId}`);

      return result;

    } catch (error) {
      console.error(`[RedisStorage] ❌ Failed to update regulation ${regulationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get regulations by status
   */
  async getRegulationsByStatus(status, limit = 50) {
    await this.connect();

    try {
      console.log(`[RedisStorage] Getting regulations with status: ${status}`);

      // Get all regulation keys
      const keys = await this.client.keys('regulation:*');
      const regulations = [];

      for (const key of keys.slice(0, limit)) {
        const data = await this.client.hGetAll(key);
        if (data.status === status) {
          regulations.push({
            ...data,
            riskScore: data.riskScore ? parseFloat(data.riskScore) : undefined,
            insights: data.insights ? JSON.parse(data.insights) : undefined,
            complianceChecklist: data.complianceChecklist ? JSON.parse(data.complianceChecklist) : undefined
          });
        }
      }

      console.log(`[RedisStorage] ✅ Found ${regulations.length} regulations with status: ${status}`);

      return {
        success: true,
        regulations,
        count: regulations.length
      };

    } catch (error) {
      console.error(`[RedisStorage] ❌ Failed to get regulations by status:`, error.message);
      throw error;
    }
  }
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node redis-storage.js <operation> <data>');
    console.error('Operations: save, get, update, getByStatus');
    process.exit(1);
  }

  const operation = args[0];
  const storage = new RedisStorageTool();

  try {
    let result;

    switch (operation) {
      case 'save':
        const regulation = JSON.parse(args[1]);
        result = await storage.saveRegulation(regulation);
        break;

      case 'get':
        const regulationId = args[1];
        result = await storage.getRegulation(regulationId);
        break;

      case 'update':
        const updateId = args[1];
        const updates = JSON.parse(args[2]);
        result = await storage.updateRegulation(updateId, updates);
        break;

      case 'getByStatus':
        const status = args[1];
        const limit = args[2] ? parseInt(args[2]) : 50;
        result = await storage.getRegulationsByStatus(status, limit);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      process.exit(1);
    }

  } catch (error) {
    console.error('[RedisStorage] Fatal error:', error.message);
    process.exit(1);
  } finally {
    await storage.disconnect();
  }
}

// Export class for use as module
module.exports = RedisStorageTool;

// Run main function if called directly
if (require.main === module) {
  main();
}