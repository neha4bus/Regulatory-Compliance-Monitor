/**
 * Slack component main export
 */

export { SlackClient, SlackConfig, SlackMessage, NotificationPreferences, defaultNotificationPreferences } from './client';
export { SlackNotificationManager, NotificationQueue, NotificationStats } from './notification-manager';

// Convenience class that combines all Slack functionality
import { SlackClient, SlackConfig, NotificationPreferences, defaultNotificationPreferences } from './client';
import { SlackNotificationManager } from './notification-manager';

export class SlackService {
  private client: SlackClient;
  public notificationManager: SlackNotificationManager;

  constructor(config: SlackConfig, preferences: NotificationPreferences = defaultNotificationPreferences) {
    this.client = new SlackClient(config, preferences);
    this.notificationManager = new SlackNotificationManager(this.client);
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    return await this.client.testConnection();
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return this.notificationManager.getStats();
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return this.notificationManager.getQueueStatus();
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.notificationManager.updatePreferences(preferences);
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.notificationManager.getPreferences();
  }

  /**
   * Force process notification queue
   */
  async processQueue(): Promise<void> {
    await this.notificationManager.forceProcessQueue();
  }
}