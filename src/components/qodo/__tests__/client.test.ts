/**
 * Unit tests for Qodo API Client
 */

import { QodoClient, QodoConfig, defaultQodoConfig } from '../client';
import { QodoAnalysisRequest } from '../../../types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QodoClient', () => {
  let client: QodoClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new QodoClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: defaultQodoConfig.baseUrl,
        timeout: defaultQodoConfig.timeout,
        headers: {
          'Authorization': `Bearer ${defaultQodoConfig.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Regulatory-Compliance-Monitor/1.0.0',
        },
      });
    });

    it('should create client with custom config', () => {
      const customConfig: QodoConfig = {
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        retryAttempts: 5,
        retryDelay: 2000,
      };

      new QodoClient(customConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: customConfig.baseUrl,
        timeout: customConfig.timeout,
        headers: {
          'Authorization': `Bearer ${customConfig.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Regulatory-Compliance-Monitor/1.0.0',
        },
      });
    });
  });

  describe('analyzeText', () => {
    const mockRequest: QodoAnalysisRequest = {
      text: 'Sample regulatory text',
      analysis_type: 'regulatory_compliance',
      industry: 'oil_and_gas',
      output_format: {
        summary: true,
        risk_score: true,
        action_items: true,
        affected_parties: true,
      },
    };

    it('should successfully analyze text', async () => {
      const mockResponse = {
        data: {
          summary: 'Test summary',
          risk_score: 7.5,
          insights: {
            what_changed: 'New emission standards',
            who_impacted: 'All operators',
            required_actions: ['Update procedures', 'Train staff'],
          },
          compliance_checklist: ['Review standards', 'Update documentation'],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.analyzeText(mockRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/analyze/regulatory', mockRequest);
      expect(result).toEqual({
        summary: 'Test summary',
        risk_score: 7.5,
        priority: 'high',
        insights: {
          what_changed: 'New emission standards',
          who_impacted: 'All operators',
          required_actions: ['Update procedures', 'Train staff'],
        },
        compliance_checklist: ['Review standards', 'Update documentation'],
      });
    });

    it('should handle API failure and return mock analysis', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const result = await client.analyzeText(mockRequest);

      expect(result).toBeDefined();
      expect(result.summary).toContain('This regulation addresses key compliance requirements');
      expect(typeof result.risk_score).toBe('number');
      expect(result.priority).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should retry on failure', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue({
          data: {
            summary: 'Success after retry',
            risk_score: 6.0,
          },
        });

      const result = await client.analyzeText(mockRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      expect(result.summary).toBe('Success after retry');
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });

      const result = await client.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toBe(true);
    });

    it('should return true when API fails (demo mode)', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      const result = await client.healthCheck();

      expect(result).toBe(true);
    });
  });

  describe('mock analysis generation', () => {
    const mockRequest: QodoAnalysisRequest = {
      text: 'Sample regulatory text',
      analysis_type: 'regulatory_compliance',
      industry: 'oil_and_gas',
      output_format: {
        summary: true,
        risk_score: true,
        action_items: true,
        affected_parties: true,
      },
    };

    it('should generate higher risk scores for emission-related content', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const emissionText = 'New emission monitoring requirements for offshore drilling operations';
      const result = await client.analyzeText({
        ...mockRequest,
        text: emissionText,
      });

      expect(result.risk_score).toBeGreaterThan(5);
      expect(result.insights.what_changed).toContain('emission');
    });

    it('should generate appropriate actions based on content', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const trainingText = 'All personnel must complete safety training within 30 days';
      const result = await client.analyzeText({
        ...mockRequest,
        text: trainingText,
      });

      expect(result.insights.required_actions).toContain('Conduct staff training sessions');
    });
  });

  describe('priority mapping', () => {
    it('should map risk scores to correct priorities', () => {
      const testCases = [
        { score: 9.5, expected: 'critical' },
        { score: 8.0, expected: 'high' },
        { score: 5.0, expected: 'medium' },
        { score: 2.0, expected: 'low' },
      ];

      testCases.forEach(({ score, expected }) => {
        const priority = client['mapPriority'](score);
        expect(priority).toBe(expected);
      });
    });
  });
});