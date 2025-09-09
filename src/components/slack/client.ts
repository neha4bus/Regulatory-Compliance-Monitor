/**
 * Slack API Client
 * Handles Slack API integration with proper authentication and error handling
 */

import { WebClient } from '@slack/web-api';
import { Regulation, ActionItem } from '../../types/models';

export interface SlackConfig {
  token: string;
  signingSecret?: string;
  defaultChannel?: string;
  enableNotifications?: boolean;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface NotificationPreferences {
  channels: {
    highPriority: string;
    general: string;
    actionItems: string;
    systemAlerts: string;
  };
  mentions: {
    criticalRegulations: string[]; // User IDs to mention for critical regulations
    systemIssues: string[]; // User IDs to mention for system issues
  };
  enabledNotifications: {
    newRegulations: boolean;
    highPriorityAlerts: boolean;
    actionItemUpdates: boolean;
    systemStatus: boolean;
    deadlineReminders: boolean;
  };
}

export const defaultNotificationPreferences: NotificationPreferences = {
  channels: {
    highPriority: '#compliance-alerts',
    general: '#regulatory-updates',
    actionItems: '#action-items',
    systemAlerts: '#system-alerts'
  },
  mentions: {
    criticalRegulations: [],
    systemIssues: []
  },
  enabledNotifications: {
    newRegulations: true,
    highPriorityAlerts: true,
    actionItemUpdates: true,
    systemStatus: true,
    deadlineReminders: true
  }
};

export class SlackClient {
  private client: WebClient;
  private config: SlackConfig;
  private preferences: NotificationPreferences;

  constructor(config: SlackConfig, preferences: NotificationPreferences = defaultNotificationPreferences) {
    this.config = config;
    this.preferences = preferences;
    this.client = new WebClient(config.token);
  }

  /**
   * Test Slack connection and permissions
   */
  async testConnection(): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    try {
      const authTest = await this.client.auth.test();
      
      if (!authTest.ok) {
        return { success: false, error: 'Authentication failed' };
      }

      return {
        success: true,
        botInfo: {
          botId: authTest.bot_id,
          userId: authTest.user_id,
          team: authTest.team,
          teamId: authTest.team_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a basic message to a channel
   */
  async sendMessage(message: SlackMessage): Promise<{ success: boolean; error?: string; timestamp?: string }> {
    if (!this.config.enableNotifications) {
      console.log('[Slack] Notifications disabled, skipping message');
      return { success: true };
    }

    try {
      const result = await this.client.chat.postMessage({
        channel: message.channel,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
        thread_ts: message.thread_ts,
        unfurl_links: message.unfurl_links ?? false,
        unfurl_media: message.unfurl_media ?? false
      });

      if (!result.ok) {
        return { success: false, error: result.error || 'Failed to send message' };
      }

      return { success: true, timestamp: result.ts as string };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send notification for new regulation
   */
  async sendNewRegulationNotification(regulation: Regulation): Promise<{ success: boolean; error?: string }> {
    if (!this.preferences.enabledNotifications.newRegulations) {
      return { success: true };
    }

    const isHighPriority = regulation.priority === 'high' || regulation.priority === 'critical';
    const channel = isHighPriority ? this.preferences.channels.highPriority : this.preferences.channels.general;

    const blocks = this.buildRegulationNotificationBlocks(regulation);
    
    return await this.sendMessage({
      channel,
      text: `New ${regulation.priority} priority regulation: ${regulation.title}`,
      blocks
    });
  }

  /**
   * Send high priority alert
   */
  async sendHighPriorityAlert(regulation: Regulation): Promise<{ success: boolean; error?: string }> {
    if (!this.preferences.enabledNotifications.highPriorityAlerts) {
      return { success: true };
    }

    const mentions = this.preferences.mentions.criticalRegulations
      .map(userId => `<@${userId}>`)
      .join(' ');

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 HIGH PRIORITY REGULATORY ALERT'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${mentions}\n\nA ${regulation.priority} priority regulation requires immediate attention.`
        }
      },
      ...this.buildRegulationNotificationBlocks(regulation),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details'
            },
            style: 'primary',
            url: `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/regulations/${regulation.id}`
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Action Items'
            },
            style: 'danger',
            value: regulation.id
          }
        ]
      }
    ];

    return await this.sendMessage({
      channel: this.preferences.channels.highPriority,
      text: `🚨 HIGH PRIORITY: ${regulation.title}`,
      blocks
    });
  }

  /**
   * Send action item notification
   */
  async sendActionItemNotification(actionItem: ActionItem, type: 'created' | 'updated' | 'completed' | 'overdue'): Promise<{ success: boolean; error?: string }> {
    if (!this.preferences.enabledNotifications.actionItemUpdates) {
      return { success: true };
    }

    const emoji = {
      created: '📋',
      updated: '🔄',
      completed: '✅',
      overdue: '⚠️'
    };

    const color = {
      created: '#36a64f',
      updated: '#2196F3',
      completed: '#4CAF50',
      overdue: '#f44336'
    };

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji[type]} *Action Item ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n*${actionItem.title}*\n${actionItem.description}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Action'
          },
          url: `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/actions/${actionItem.id}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Priority: *${actionItem.priority}* | Status: *${actionItem.status}* | Assigned: ${actionItem.assignedTo || 'Unassigned'}`
          }
        ]
      }
    ];

    if (actionItem.dueDate) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 Due: ${actionItem.dueDate.toLocaleDateString()}`
          }
        ]
      });
    }

    return await this.sendMessage({
      channel: this.preferences.channels.actionItems,
      text: `${emoji[type]} Action item ${type}: ${actionItem.title}`,
      blocks
    });
  }

  /**
   * Send deadline reminder
   */
  async sendDeadlineReminder(actionItems: ActionItem[]): Promise<{ success: boolean; error?: string }> {
    if (!this.preferences.enabledNotifications.deadlineReminders || actionItems.length === 0) {
      return { success: true };
    }

    const overdueItems = actionItems.filter(item => 
      item.dueDate && item.dueDate < new Date() && item.status !== 'completed'
    );
    
    const dueSoonItems = actionItems.filter(item => 
      item.dueDate && 
      item.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && 
      item.dueDate >= new Date() &&
      item.status !== 'completed'
    );

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📅 Compliance Deadline Reminder'
        }
      }
    ];

    if (overdueItems.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ ${overdueItems.length} Overdue Action Items:*`
        }
      });

      overdueItems.slice(0, 5).forEach(item => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${item.title}* - Due: ${item.dueDate?.toLocaleDateString()} (${item.assignedTo || 'Unassigned'})`
          }
        });
      });
    }

    if (dueSoonItems.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 ${dueSoonItems.length} Items Due This Week:*`
        }
      });

      dueSoonItems.slice(0, 5).forEach(item => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${item.title}* - Due: ${item.dueDate?.toLocaleDateString()} (${item.assignedTo || 'Unassigned'})`
          }
        });
      });
    }

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View All Action Items'
          },
          style: 'primary',
          url: `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/actions`
        }
      ]
    });

    return await this.sendMessage({
      channel: this.preferences.channels.actionItems,
      text: `📅 Deadline reminder: ${overdueItems.length} overdue, ${dueSoonItems.length} due soon`,
      blocks
    });
  }

  /**
   * Send system status notification
   */
  async sendSystemStatusNotification(status: 'healthy' | 'warning' | 'error', message: string, details?: any): Promise<{ success: boolean; error?: string }> {
    if (!this.preferences.enabledNotifications.systemStatus) {
      return { success: true };
    }

    const emoji = {
      healthy: '✅',
      warning: '⚠️',
      error: '🚨'
    };

    const color = {
      healthy: '#4CAF50',
      warning: '#FF9800',
      error: '#f44336'
    };

    const mentions = status === 'error' 
      ? this.preferences.mentions.systemIssues.map(userId => `<@${userId}>`).join(' ')
      : '';

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji[status]} *System Status: ${status.toUpperCase()}*\n\n${mentions}\n\n${message}`
        }
      }
    ];

    if (details) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``
        }
      });
    }

    return await this.sendMessage({
      channel: this.preferences.channels.systemAlerts,
      text: `${emoji[status]} System ${status}: ${message}`,
      blocks
    });
  }

  /**
   * Build regulation notification blocks
   */
  private buildRegulationNotificationBlocks(regulation: Regulation): any[] {
    const priorityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${regulation.title}*\n\n${regulation.summary || 'Processing AI analysis...'}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details'
          },
          url: `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/regulations/${regulation.id}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Source:*\n${regulation.source}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${priorityEmoji[regulation.priority || 'medium']} ${regulation.priority || 'Medium'}`
          },
          {
            type: 'mrkdwn',
            text: `*Risk Score:*\n${regulation.riskScore ? `${regulation.riskScore}/10` : 'Calculating...'}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${regulation.date.toLocaleDateString()}`
          }
        ]
      }
    ];

    if (regulation.insights?.requiredActions && regulation.insights.requiredActions.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Required Actions:*\n${regulation.insights.requiredActions.slice(0, 3).map(action => `• ${action}`).join('\n')}`
        }
      });
    }

    if (regulation.complianceChecklist && regulation.complianceChecklist.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Compliance Checklist:*\n${regulation.complianceChecklist.slice(0, 3).map(item => `• ${item}`).join('\n')}`
        }
      });
    }

    return blocks;
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}