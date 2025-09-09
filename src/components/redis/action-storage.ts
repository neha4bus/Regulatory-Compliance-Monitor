/**
 * Redis storage utilities for action items
 */

import { RedisConnection } from './config';
import { ActionItem, ActionItemFilter, ActionItemStats } from '../../types/models';

export class ActionItemStorage {
  private redis: RedisConnection;

  constructor(redis: RedisConnection) {
    this.redis = redis;
  }

  /**
   * Save an action item to Redis
   */
  async saveActionItem(actionItem: ActionItem): Promise<ActionItem> {
    const client = this.redis.getClient();
    const actionKey = `action:${actionItem.id}`;

    // Prepare data for storage
    const actionData: Record<string, string> = {
      id: actionItem.id,
      regulationId: actionItem.regulationId,
      title: actionItem.title,
      description: actionItem.description,
      priority: actionItem.priority,
      status: actionItem.status,
      createdAt: actionItem.createdAt.toISOString(),
      updatedAt: actionItem.updatedAt.toISOString(),
      category: actionItem.category,
      tags: JSON.stringify(actionItem.tags)
    };

    // Add optional fields
    if (actionItem.assignedTo) actionData.assignedTo = actionItem.assignedTo;
    if (actionItem.assignedBy) actionData.assignedBy = actionItem.assignedBy;
    if (actionItem.dueDate) actionData.dueDate = actionItem.dueDate.toISOString();
    if (actionItem.completedAt) actionData.completedAt = actionItem.completedAt.toISOString();
    if (actionItem.estimatedHours) actionData.estimatedHours = actionItem.estimatedHours.toString();
    if (actionItem.actualHours) actionData.actualHours = actionItem.actualHours.toString();
    if (actionItem.notes) actionData.notes = actionItem.notes;
    if (actionItem.attachments) actionData.attachments = JSON.stringify(actionItem.attachments);
    if (actionItem.dependencies) actionData.dependencies = JSON.stringify(actionItem.dependencies);

    // Store action item
    await client.hSet(actionKey, actionData);

    // Add to indexes for efficient querying
    await this.updateIndexes(actionItem);

    return actionItem;
  }

  /**
   * Get an action item by ID
   */
  async getActionItem(id: string): Promise<ActionItem | null> {
    const client = this.redis.getClient();
    const actionKey = `action:${id}`;
    
    const data = await client.hGetAll(actionKey);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.parseActionItemData(data);
  }

  /**
   * Get all action items with optional filtering
   */
  async getActionItems(filter?: ActionItemFilter, limit: number = 100, offset: number = 0): Promise<ActionItem[]> {
    const client = this.redis.getClient();
    
    // Get all action keys
    const keys = await client.keys('action:*');
    
    if (keys.length === 0) {
      return [];
    }

    // Get all action items
    const actionItems: ActionItem[] = [];
    for (const key of keys) {
      const id = key.replace('action:', '');
      const actionItem = await this.getActionItem(id);
      if (actionItem) {
        actionItems.push(actionItem);
      }
    }

    // Apply filters
    let filtered = this.applyFilters(actionItems, filter);

    // Sort by priority and due date
    filtered.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      // Finally by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Update an action item
   */
  async updateActionItem(id: string, updates: Partial<ActionItem>): Promise<ActionItem | null> {
    const existing = await this.getActionItem(id);
    if (!existing) {
      return null;
    }

    const updated: ActionItem = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    // If status changed to completed, set completedAt
    if (updates.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = new Date();
    }

    return await this.saveActionItem(updated);
  }

  /**
   * Delete an action item
   */
  async deleteActionItem(id: string): Promise<boolean> {
    const client = this.redis.getClient();
    const actionItem = await this.getActionItem(id);
    
    if (!actionItem) {
      return false;
    }

    // Remove from Redis
    const actionKey = `action:${id}`;
    await client.del(actionKey);

    // Remove from indexes
    await this.removeFromIndexes(actionItem);

    return true;
  }

  /**
   * Get action items for a specific regulation
   */
  async getActionItemsForRegulation(regulationId: string): Promise<ActionItem[]> {
    return await this.getActionItems({ regulationId });
  }

  /**
   * Get action items assigned to a user
   */
  async getActionItemsForUser(userId: string): Promise<ActionItem[]> {
    return await this.getActionItems({ assignedTo: [userId] });
  }

  /**
   * Get action item statistics
   */
  async getActionItemStats(filter?: ActionItemFilter): Promise<ActionItemStats> {
    const actionItems = await this.getActionItems(filter, 1000); // Get all for stats
    
    const stats: ActionItemStats = {
      total: actionItems.length,
      byStatus: { pending: 0, in_progress: 0, completed: 0, blocked: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byCategory: { compliance: 0, implementation: 0, review: 0, training: 0, reporting: 0 },
      overdue: 0,
      dueSoon: 0
    };

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    actionItems.forEach(item => {
      stats.byStatus[item.status]++;
      stats.byPriority[item.priority]++;
      stats.byCategory[item.category]++;

      if (item.dueDate) {
        if (item.dueDate < now && item.status !== 'completed') {
          stats.overdue++;
        } else if (item.dueDate <= sevenDaysFromNow && item.status !== 'completed') {
          stats.dueSoon++;
        }
      }
    });

    return stats;
  }

  /**
   * Create action items from regulation compliance checklist
   */
  async createActionItemsFromRegulation(regulationId: string, complianceChecklist: string[], assignedTo?: string): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];
    
    for (let i = 0; i < complianceChecklist.length; i++) {
      const item = complianceChecklist[i];
      const actionItem: ActionItem = {
        id: `${regulationId}_action_${i + 1}`,
        regulationId,
        title: item,
        description: `Compliance action required for regulation: ${item}`,
        priority: 'medium', // Default priority, can be updated
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: 'compliance',
        tags: ['auto-generated', 'compliance'],
        assignedTo
      };

      await this.saveActionItem(actionItem);
      actionItems.push(actionItem);
    }

    return actionItems;
  }

  /**
   * Parse action item data from Redis
   */
  private parseActionItemData(data: Record<string, string>): ActionItem {
    return {
      id: data.id,
      regulationId: data.regulationId,
      title: data.title,
      description: data.description,
      priority: data.priority as ActionItem['priority'],
      status: data.status as ActionItem['status'],
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      tags: JSON.parse(data.tags || '[]'),
      category: data.category as ActionItem['category'],
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
      actualHours: data.actualHours ? parseFloat(data.actualHours) : undefined,
      notes: data.notes,
      attachments: data.attachments ? JSON.parse(data.attachments) : undefined,
      dependencies: data.dependencies ? JSON.parse(data.dependencies) : undefined
    };
  }

  /**
   * Apply filters to action items
   */
  private applyFilters(actionItems: ActionItem[], filter?: ActionItemFilter): ActionItem[] {
    if (!filter) return actionItems;

    return actionItems.filter(item => {
      if (filter.status && !filter.status.includes(item.status)) return false;
      if (filter.priority && !filter.priority.includes(item.priority)) return false;
      if (filter.assignedTo && (!item.assignedTo || !filter.assignedTo.includes(item.assignedTo))) return false;
      if (filter.category && !filter.category.includes(item.category)) return false;
      if (filter.regulationId && item.regulationId !== filter.regulationId) return false;
      
      if (filter.dueDateRange) {
        if (filter.dueDateRange.start && (!item.dueDate || item.dueDate < filter.dueDateRange.start)) return false;
        if (filter.dueDateRange.end && (!item.dueDate || item.dueDate > filter.dueDateRange.end)) return false;
      }
      
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => item.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }

  /**
   * Update indexes for efficient querying
   */
  private async updateIndexes(actionItem: ActionItem): Promise<void> {
    const client = this.redis.getClient();
    
    // Add to regulation index
    await client.sAdd(`regulation_actions:${actionItem.regulationId}`, actionItem.id);
    
    // Add to user index if assigned
    if (actionItem.assignedTo) {
      await client.sAdd(`user_actions:${actionItem.assignedTo}`, actionItem.id);
    }
    
    // Add to status index
    await client.sAdd(`actions_by_status:${actionItem.status}`, actionItem.id);
    
    // Add to priority index
    await client.sAdd(`actions_by_priority:${actionItem.priority}`, actionItem.id);
  }

  /**
   * Remove from indexes
   */
  private async removeFromIndexes(actionItem: ActionItem): Promise<void> {
    const client = this.redis.getClient();
    
    // Remove from all indexes
    await client.sRem(`regulation_actions:${actionItem.regulationId}`, actionItem.id);
    
    if (actionItem.assignedTo) {
      await client.sRem(`user_actions:${actionItem.assignedTo}`, actionItem.id);
    }
    
    await client.sRem(`actions_by_status:${actionItem.status}`, actionItem.id);
    await client.sRem(`actions_by_priority:${actionItem.priority}`, actionItem.id);
  }
}