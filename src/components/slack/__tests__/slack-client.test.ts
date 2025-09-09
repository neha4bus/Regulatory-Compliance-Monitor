/**
 * Tests for Slack Client
 */

import { SlackClient, SlackConfig, defaultNotificationPreferences } from '../client';
import { Regulation, ActionItem } from '../../../types/models';

// Mock the Slack WebClient
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    auth: {
      test: jest.fn()
    },
    chat: {
      postMessage: jest.fn()
    }
  }))
}));

describe('SlackClient', () => {
  let slackClient: SlackClient;
  let mockWebClient: any;
  let mockConfig: SlackConfig;

  beforeEach(() => {
    mockConfig = {
      token: 'xoxb-test-token',
      enableNotifications: true,
      defaultChannel: '#test-channel'
    };

    const { WebClient } = require('@slack/web-api');
    mockWebClient = new WebClient();
    slackClient = new SlackClient(mockConfig, defaultNotificationPreferences);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return success when authentication is valid', async () => {
      mockWebClient.auth.test.mockResolvedValue({
        ok: true,
        bot_id: 'B123456',
        user_id: 'U123456',
        team: 'Test Team',
        team_id: 'T123456'
      });

      const result = await slackClient.testConnection();

      expect(result.success).toBe(true);
      expect(result.botInfo).toEqual({
        botId: 'B123456',
        userId: 'U123456',
        team: 'Test Team',
        teamId: 'T123456'
      });
    });

    it('should return error when authentication fails', async () => {
      mockWebClient.auth.test.mockResolvedValue({
        ok: false,
        error: 'invalid_auth'
      });

      const result = await slackClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('should handle network errors', async () => {
      mockWebClient.auth.test.mockRejectedValue(new Error('Network error'));

      const result = await slackClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const message = {
        channel: '#test-channel',
        text: 'Test message',
        blocks: []
      };

      const result = await slackClient.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.timestamp).toBe('1234567890.123456');
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: '#test-channel',
        text: 'Test message',
        blocks: [],
        unfurl_links: false,
        unfurl_media: false
      });
    });

    it('should skip sending when notifications are disabled', async () => {
      const disabledConfig = { ...mockConfig, enableNotifications: false };
      const disabledClient = new SlackClient(disabledConfig);

      const message = {
        channel: '#test-channel',
        text: 'Test message'
      };

      const result = await disabledClient.sendMessage(message);

      expect(result.success).toBe(true);
      expect(mockWebClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: false,
        error: 'channel_not_found'
      });

      const message = {
        channel: '#nonexistent-channel',
        text: 'Test message'
      };

      const result = await slackClient.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('channel_not_found');
    });
  });

  describe('sendNewRegulationNotification', () => {
    it('should send notification for new regulation', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const regulation: Regulation = {
        id: 'reg-001',
        title: 'Test Regulation',
        date: new Date('2025-01-08'),
        url: 'https://test.gov/reg-001',
        fullText: 'Test regulation content',
        source: 'EPA',
        scrapedAt: new Date(),
        hash: 'test-hash',
        status: 'analyzed',
        priority: 'medium',
        riskScore: 7.5,
        summary: 'Test regulation summary'
      };

      const result = await slackClient.sendNewRegulationNotification(regulation);

      expect(result.success).toBe(true);
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#regulatory-updates', // Default general channel
          text: 'New medium priority regulation: Test Regulation'
        })
      );
    });

    it('should use high priority channel for critical regulations', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const regulation: Regulation = {
        id: 'reg-001',
        title: 'Critical Regulation',
        date: new Date('2025-01-08'),
        url: 'https://test.gov/reg-001',
        fullText: 'Critical regulation content',
        source: 'EPA',
        scrapedAt: new Date(),
        hash: 'test-hash',
        status: 'analyzed',
        priority: 'critical',
        riskScore: 9.5
      };

      const result = await slackClient.sendNewRegulationNotification(regulation);

      expect(result.success).toBe(true);
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#compliance-alerts', // High priority channel
          text: 'New critical priority regulation: Critical Regulation'
        })
      );
    });
  });

  describe('sendHighPriorityAlert', () => {
    it('should send high priority alert with mentions', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const preferences = {
        ...defaultNotificationPreferences,
        mentions: {
          criticalRegulations: ['U123456', 'U789012'],
          systemIssues: []
        }
      };

      const alertClient = new SlackClient(mockConfig, preferences);

      const regulation: Regulation = {
        id: 'reg-001',
        title: 'Emergency Regulation',
        date: new Date('2025-01-08'),
        url: 'https://test.gov/reg-001',
        fullText: 'Emergency regulation content',
        source: 'EPA',
        scrapedAt: new Date(),
        hash: 'test-hash',
        status: 'analyzed',
        priority: 'critical',
        riskScore: 9.8
      };

      const result = await alertClient.sendHighPriorityAlert(regulation);

      expect(result.success).toBe(true);
      
      const call = mockWebClient.chat.postMessage.mock.calls[0][0];
      expect(call.channel).toBe('#compliance-alerts');
      expect(call.text).toBe('🚨 HIGH PRIORITY: Emergency Regulation');
      expect(call.blocks[0].text.text).toBe('🚨 HIGH PRIORITY REGULATORY ALERT');
      expect(call.blocks[1].text.text).toContain('<@U123456> <@U789012>');
    });
  });

  describe('sendActionItemNotification', () => {
    it('should send action item notification', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const actionItem: ActionItem = {
        id: 'action-001',
        regulationId: 'reg-001',
        title: 'Test Action Item',
        description: 'Test action description',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: 'compliance',
        tags: ['test'],
        assignedTo: 'john.doe@company.com',
        dueDate: new Date('2025-02-08')
      };

      const result = await slackClient.sendActionItemNotification(actionItem, 'created');

      expect(result.success).toBe(true);
      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: '#action-items',
          text: '📋 Action item created: Test Action Item'
        })
      );
    });
  });

  describe('sendDeadlineReminder', () => {
    it('should send deadline reminder for multiple action items', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const actionItems: ActionItem[] = [
        {
          id: 'action-001',
          regulationId: 'reg-001',
          title: 'Overdue Action',
          description: 'Test description',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          category: 'compliance',
          tags: [],
          dueDate: new Date('2025-01-01') // Overdue
        },
        {
          id: 'action-002',
          regulationId: 'reg-001',
          title: 'Due Soon Action',
          description: 'Test description',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
          category: 'compliance',
          tags: [],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Due in 3 days
        }
      ];

      const result = await slackClient.sendDeadlineReminder(actionItems);

      expect(result.success).toBe(true);
      
      const call = mockWebClient.chat.postMessage.mock.calls[0][0];
      expect(call.channel).toBe('#action-items');
      expect(call.text).toContain('1 overdue, 1 due soon');
      expect(call.blocks[0].text.text).toBe('📅 Compliance Deadline Reminder');
    });

    it('should skip sending when no action items provided', async () => {
      const result = await slackClient.sendDeadlineReminder([]);

      expect(result.success).toBe(true);
      expect(mockWebClient.chat.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendSystemStatusNotification', () => {
    it('should send system status notification', async () => {
      mockWebClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456'
      });

      const result = await slackClient.sendSystemStatusNotification(
        'error',
        'Database connection failed',
        { error: 'Connection timeout', retries: 3 }
      );

      expect(result.success).toBe(true);
      
      const call = mockWebClient.chat.postMessage.mock.calls[0][0];
      expect(call.channel).toBe('#system-alerts');
      expect(call.text).toBe('🚨 System error: Database connection failed');
      expect(call.blocks[0].text.text).toContain('🚨 *System Status: ERROR*');
    });
  });

  describe('preferences management', () => {
    it('should update notification preferences', () => {
      const newPreferences = {
        channels: {
          ...defaultNotificationPreferences.channels,
          highPriority: '#custom-alerts'
        }
      };

      slackClient.updatePreferences(newPreferences);
      const preferences = slackClient.getPreferences();

      expect(preferences.channels.highPriority).toBe('#custom-alerts');
    });

    it('should return current preferences', () => {
      const preferences = slackClient.getPreferences();

      expect(preferences).toEqual(defaultNotificationPreferences);
    });
  });
});