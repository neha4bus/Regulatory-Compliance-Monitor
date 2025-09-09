#!/usr/bin/env node

/**
 * Slack Notifier Tool for Senso MCP
 * Sends Slack notifications for regulations and action items
 */

const { WebClient } = require('@slack/web-api');

class SlackNotifierTool {
  constructor() {
    this.token = process.env.SLACK_BOT_TOKEN;
    this.client = this.token ? new WebClient(this.token) : null;
    this.defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || '#regulatory-updates';
    this.alertChannel = process.env.SLACK_ALERT_CHANNEL || '#compliance-alerts';
  }

  /**
   * Send regulation notification
   */
  async sendRegulationNotification(regulation, options = {}) {
    try {
      console.log(`[SlackNotifier] Sending regulation notification: ${regulation.id}`);

      if (!this.client) {
        console.log('[SlackNotifier] ⚠️ No Slack token found, using mock notification');
        return this.mockNotification('regulation', regulation);
      }

      const isHighPriority = regulation.priority === 'high' || regulation.priority === 'critical';
      const channel = options.channel || (isHighPriority ? this.alertChannel : this.defaultChannel);

      const blocks = this.buildRegulationBlocks(regulation, options);
      
      const result = await this.client.chat.postMessage({
        channel: channel,
        text: `New ${regulation.priority || 'medium'} priority regulation: ${regulation.title}`,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      console.log(`[SlackNotifier] ✅ Regulation notification sent to ${channel}`);

      return {
        success: true,
        channel: channel,
        timestamp: result.ts,
        messageId: `${channel}_${result.ts}`
      };

    } catch (error) {
      console.error(`[SlackNotifier] ❌ Failed to send regulation notification:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send high priority alert
   */
  async sendHighPriorityAlert(regulation, mentions = []) {
    try {
      console.log(`[SlackNotifier] Sending HIGH PRIORITY alert: ${regulation.id}`);

      if (!this.client) {
        console.log('[SlackNotifier] ⚠️ No Slack token found, using mock alert');
        return this.mockNotification('alert', regulation);
      }

      const mentionText = mentions.length > 0 
        ? mentions.map(userId => `<@${userId}>`).join(' ') + '\n\n'
        : '';

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
            text: `${mentionText}A ${regulation.priority} priority regulation requires immediate attention.`
          }
        },
        ...this.buildRegulationBlocks(regulation, { includeActions: true })
      ];

      const result = await this.client.chat.postMessage({
        channel: this.alertChannel,
        text: `🚨 HIGH PRIORITY: ${regulation.title}`,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send alert');
      }

      console.log(`[SlackNotifier] ✅ High priority alert sent to ${this.alertChannel}`);

      return {
        success: true,
        channel: this.alertChannel,
        timestamp: result.ts,
        messageId: `${this.alertChannel}_${result.ts}`,
        alertLevel: 'high_priority'
      };

    } catch (error) {
      console.error(`[SlackNotifier] ❌ Failed to send high priority alert:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send action item notification
   */
  async sendActionItemNotification(actionItem, type = 'created', options = {}) {
    try {
      console.log(`[SlackNotifier] Sending action item notification: ${actionItem.id} (${type})`);

      if (!this.client) {
        console.log('[SlackNotifier] ⚠️ No Slack token found, using mock notification');
        return this.mockNotification('action_item', actionItem);
      }

      const emoji = {
        created: '📋',
        updated: '🔄',
        completed: '✅',
        overdue: '⚠️'
      };

      const channel = options.channel || process.env.SLACK_ACTION_CHANNEL || '#action-items';

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji[type]} *Action Item ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n*${actionItem.title}*\n${actionItem.description || 'No description provided'}`
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
              text: `📅 Due: ${new Date(actionItem.dueDate).toLocaleDateString()}`
            }
          ]
        });
      }

      const result = await this.client.chat.postMessage({
        channel: channel,
        text: `${emoji[type]} Action item ${type}: ${actionItem.title}`,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      console.log(`[SlackNotifier] ✅ Action item notification sent to ${channel}`);

      return {
        success: true,
        channel: channel,
        timestamp: result.ts,
        messageId: `${channel}_${result.ts}`,
        actionType: type
      };

    } catch (error) {
      console.error(`[SlackNotifier] ❌ Failed to send action item notification:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send system status notification
   */
  async sendSystemNotification(status, message, details = null) {
    try {
      console.log(`[SlackNotifier] Sending system notification: ${status}`);

      if (!this.client) {
        console.log('[SlackNotifier] ⚠️ No Slack token found, using mock notification');
        return this.mockNotification('system', { status, message, details });
      }

      const emoji = {
        healthy: '✅',
        warning: '⚠️',
        error: '🚨'
      };

      const channel = process.env.SLACK_SYSTEM_CHANNEL || '#system-alerts';

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji[status]} *System Status: ${status.toUpperCase()}*\n\n${message}`
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

      const result = await this.client.chat.postMessage({
        channel: channel,
        text: `${emoji[status]} System ${status}: ${message}`,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      console.log(`[SlackNotifier] ✅ System notification sent to ${channel}`);

      return {
        success: true,
        channel: channel,
        timestamp: result.ts,
        messageId: `${channel}_${result.ts}`,
        status: status
      };

    } catch (error) {
      console.error(`[SlackNotifier] ❌ Failed to send system notification:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build regulation notification blocks
   */
  buildRegulationBlocks(regulation, options = {}) {
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
          text: `*${regulation.title}*\n\n${regulation.summary || 'AI analysis in progress...'}`
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
            text: `*Priority:*\n${priorityEmoji[regulation.priority || 'medium']} ${(regulation.priority || 'Medium').charAt(0).toUpperCase() + (regulation.priority || 'medium').slice(1)}`
          },
          {
            type: 'mrkdwn',
            text: `*Risk Score:*\n${regulation.riskScore ? `${regulation.riskScore}/10` : 'Calculating...'}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${new Date(regulation.date).toLocaleDateString()}`
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

    if (options.includeActions) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Action Items'
            },
            style: 'primary',
            value: regulation.id
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Mark Reviewed'
            },
            value: `review_${regulation.id}`
          }
        ]
      });
    }

    return blocks;
  }

  /**
   * Mock notification for testing/demo
   */
  mockNotification(type, data) {
    const timestamp = new Date().toISOString();
    
    console.log(`[SlackNotifier] 📱 MOCK NOTIFICATION (${type.toUpperCase()})`);
    console.log(`[SlackNotifier] Timestamp: ${timestamp}`);
    
    switch (type) {
      case 'regulation':
        console.log(`[SlackNotifier] Title: ${data.title}`);
        console.log(`[SlackNotifier] Priority: ${data.priority || 'medium'}`);
        console.log(`[SlackNotifier] Source: ${data.source}`);
        break;
      case 'alert':
        console.log(`[SlackNotifier] 🚨 HIGH PRIORITY ALERT`);
        console.log(`[SlackNotifier] Regulation: ${data.title}`);
        break;
      case 'action_item':
        console.log(`[SlackNotifier] Action: ${data.title}`);
        console.log(`[SlackNotifier] Status: ${data.status}`);
        break;
      case 'system':
        console.log(`[SlackNotifier] Status: ${data.status}`);
        console.log(`[SlackNotifier] Message: ${data.message}`);
        break;
    }

    return {
      success: true,
      mock: true,
      channel: '#mock-channel',
      timestamp: timestamp,
      messageId: `mock_${Date.now()}`
    };
  }

  /**
   * Test Slack connection
   */
  async testConnection() {
    if (!this.client) {
      return {
        success: false,
        error: 'No Slack token configured'
      };
    }

    try {
      const result = await this.client.auth.test();
      
      if (!result.ok) {
        return {
          success: false,
          error: result.error || 'Authentication failed'
        };
      }

      return {
        success: true,
        botInfo: {
          botId: result.bot_id,
          userId: result.user_id,
          team: result.team,
          teamId: result.team_id
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node slack-notifier.js <type> <data-json> [options-json]');
    console.error('Types: regulation, alert, action_item, system, test');
    process.exit(1);
  }

  const type = args[0];
  const notifier = new SlackNotifierTool();

  try {
    let result;

    switch (type) {
      case 'regulation':
        const regulation = JSON.parse(args[1]);
        const regOptions = args[2] ? JSON.parse(args[2]) : {};
        result = await notifier.sendRegulationNotification(regulation, regOptions);
        break;

      case 'alert':
        const alertRegulation = JSON.parse(args[1]);
        const mentions = args[2] ? JSON.parse(args[2]) : [];
        result = await notifier.sendHighPriorityAlert(alertRegulation, mentions);
        break;

      case 'action_item':
        const actionItem = JSON.parse(args[1]);
        const actionOptions = args[2] ? JSON.parse(args[2]) : {};
        const actionType = actionOptions.type || 'created';
        result = await notifier.sendActionItemNotification(actionItem, actionType, actionOptions);
        break;

      case 'system':
        const systemData = JSON.parse(args[1]);
        result = await notifier.sendSystemNotification(
          systemData.status,
          systemData.message,
          systemData.details
        );
        break;

      case 'test':
        result = await notifier.testConnection();
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      process.exit(1);
    }

  } catch (error) {
    console.error('[SlackNotifier] Fatal error:', error.message);
    process.exit(1);
  }
}

// Export class for use as module
module.exports = SlackNotifierTool;

// Run main function if called directly
if (require.main === module) {
  main();
}