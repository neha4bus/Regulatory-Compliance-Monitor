/**
 * Slack Notification Manager
 * Orchestrates different types of notifications and manages delivery preferences
 */

import { SlackClient, NotificationPreferences } from './client';
import { Regulation, ActionItem } from '../../types/models';

export interface NotificationQueue {
  id: string;
  type: 'regulation' | 'action_item' | 'deadline' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

export interface NotificationStats {
  sent: number;
  failed: number;
  queued: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export class SlackNotificationManager {
  private slackClient: SlackClient;
  private queue: NotificationQueue[] = [];
  private isProcessing: boolean = false;
  private stats: NotificationStats = {
    sent: 0,
    failed: 0,
    queued: 0,
    byType: {},
    byPriority: {}
  };

  constructor(slackClient: SlackClient) {
    this.slackClient = slackClient;
    this.startQueueProcessor();
  }

  /**
   * Queue a regulation notification
   */
  async queueRegulationNotification(regulation: Regulation, immediate: boolean = false): Promise<void> {
    const priority = regulation.priority || 'medium';
    const scheduledFor = immediate ? new Date() : new Date(Date.now() + this.getDelayForPriority(priority));

    const notification: NotificationQueue = {
      id: `reg_${regulation.id}_${Date.now()}`,
      type: 'regulation',
      priority,
      data: regulation,
      scheduledFor,
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(notification);
    this.stats.queued++;
    this.updateStats('byType', 'regulation');
    this.updateStats('byPriority', priority);

    console.log(`[Slack] Queued regulation notification: ${regulation.title} (Priority: ${priority})`);
  }

  /**
   * Queue an action item notification
   */
  async queueActionItemNotification(
    actionItem: ActionItem, 
    type: 'created' | 'updated' | 'completed' | 'overdue',
    immediate: boolean = false
  ): Promise<void> {
    const priority = type === 'overdue' ? 'high' : actionItem.priority;
    const scheduledFor = immediate ? new Date() : new Date(Date.now() + this.getDelayForPriority(priority));

    const notification: NotificationQueue = {
      id: `action_${actionItem.id}_${type}_${Date.now()}`,
      type: 'action_item',
      priority,
      data: { actionItem, notificationType: type },
      scheduledFor,
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(notification);
    this.stats.queued++;
    this.updateStats('byType', 'action_item');
    this.updateStats('byPriority', priority);

    console.log(`[Slack] Queued action item notification: ${actionItem.title} (${type})`);
  }

  /**
   * Queue deadline reminder notifications
   */
  async queueDeadlineReminders(actionItems: ActionItem[]): Promise<void> {
    if (actionItems.length === 0) return;

    const notification: NotificationQueue = {
      id: `deadline_${Date.now()}`,
      type: 'deadline',
      priority: 'medium',
      data: actionItems,
      scheduledFor: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(notification);
    this.stats.queued++;
    this.updateStats('byType', 'deadline');
    this.updateStats('byPriority', 'medium');

    console.log(`[Slack] Queued deadline reminder for ${actionItems.length} action items`);
  }

  /**
   * Queue system status notification
   */
  async queueSystemNotification(
    status: 'healthy' | 'warning' | 'error',
    message: string,
    details?: any,
    immediate: boolean = true
  ): Promise<void> {
    const priority = status === 'error' ? 'critical' : status === 'warning' ? 'high' : 'low';
    const scheduledFor = immediate ? new Date() : new Date(Date.now() + this.getDelayForPriority(priority));

    const notification: NotificationQueue = {
      id: `system_${status}_${Date.now()}`,
      type: 'system',
      priority,
      data: { status, message, details },
      scheduledFor,
      attempts: 0,
      maxAttempts: 5 // More retries for system notifications
    };

    this.queue.push(notification);
    this.stats.queued++;
    this.updateStats('byType', 'system');
    this.updateStats('byPriority', priority);

    console.log(`[Slack] Queued system notification: ${status} - ${message}`);
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Sort queue by priority and scheduled time
      this.queue.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });

      const now = new Date();
      const readyNotifications = this.queue.filter(n => n.scheduledFor <= now);

      for (const notification of readyNotifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('[Slack] Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual notification
   */
  private async processNotification(notification: NotificationQueue): Promise<void> {
    try {
      notification.attempts++;
      let result: { success: boolean; error?: string } = { success: false };

      switch (notification.type) {
        case 'regulation':
          const regulation = notification.data as Regulation;
          if (regulation.priority === 'high' || regulation.priority === 'critical') {
            result = await this.slackClient.sendHighPriorityAlert(regulation);
          } else {
            result = await this.slackClient.sendNewRegulationNotification(regulation);
          }
          break;

        case 'action_item':
          const { actionItem, notificationType } = notification.data;
          result = await this.slackClient.sendActionItemNotification(actionItem, notificationType);
          break;

        case 'deadline':
          const actionItems = notification.data as ActionItem[];
          result = await this.slackClient.sendDeadlineReminder(actionItems);
          break;

        case 'system':
          const { status, message, details } = notification.data;
          result = await this.slackClient.sendSystemStatusNotification(status, message, details);
          break;

        default:
          console.warn(`[Slack] Unknown notification type: ${notification.type}`);
          result = { success: false, error: 'Unknown notification type' };
      }

      if (result.success) {
        // Remove from queue
        this.queue = this.queue.filter(n => n.id !== notification.id);
        this.stats.sent++;
        this.stats.queued--;
        console.log(`[Slack] Successfully sent notification: ${notification.id}`);
      } else {
        // Handle failure
        notification.lastError = result.error;
        
        if (notification.attempts >= notification.maxAttempts) {
          // Max attempts reached, remove from queue
          this.queue = this.queue.filter(n => n.id !== notification.id);
          this.stats.failed++;
          this.stats.queued--;
          console.error(`[Slack] Failed to send notification after ${notification.maxAttempts} attempts: ${notification.id} - ${result.error}`);
        } else {
          // Reschedule for retry with exponential backoff
          const backoffDelay = Math.pow(2, notification.attempts) * 1000; // 2s, 4s, 8s, etc.
          notification.scheduledFor = new Date(Date.now() + backoffDelay);
          console.warn(`[Slack] Retrying notification ${notification.id} in ${backoffDelay}ms (attempt ${notification.attempts}/${notification.maxAttempts})`);
        }
      }
    } catch (error) {
      console.error(`[Slack] Error processing notification ${notification.id}:`, error);
      notification.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (notification.attempts >= notification.maxAttempts) {
        this.queue = this.queue.filter(n => n.id !== notification.id);
        this.stats.failed++;
        this.stats.queued--;
      }
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process queue every 5 seconds
  }

  /**
   * Get delay based on priority
   */
  private getDelayForPriority(priority: string): number {
    switch (priority) {
      case 'critical': return 0; // Immediate
      case 'high': return 30 * 1000; // 30 seconds
      case 'medium': return 5 * 60 * 1000; // 5 minutes
      case 'low': return 30 * 60 * 1000; // 30 minutes
      default: return 5 * 60 * 1000;
    }
  }

  /**
   * Update statistics
   */
  private updateStats(category: 'byType' | 'byPriority', key: string): void {
    this.stats[category][key] = (this.stats[category][key] || 0) + 1;
  }

  /**
   * Get notification statistics
   */
  getStats(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { total: number; ready: number; scheduled: number; failed: number } {
    const now = new Date();
    const ready = this.queue.filter(n => n.scheduledFor <= now).length;
    const scheduled = this.queue.filter(n => n.scheduledFor > now).length;
    const failed = this.queue.filter(n => n.attempts >= n.maxAttempts).length;

    return {
      total: this.queue.length,
      ready,
      scheduled,
      failed
    };
  }

  /**
   * Clear failed notifications from queue
   */
  clearFailedNotifications(): number {
    const failedCount = this.queue.filter(n => n.attempts >= n.maxAttempts).length;
    this.queue = this.queue.filter(n => n.attempts < n.maxAttempts);
    this.stats.queued -= failedCount;
    return failedCount;
  }

  /**
   * Force process all ready notifications
   */
  async forceProcessQueue(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    return await this.slackClient.testConnection();
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.slackClient.updatePreferences(preferences);
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.slackClient.getPreferences();
  }
}