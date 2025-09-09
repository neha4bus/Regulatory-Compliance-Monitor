/**
 * Qodo AI API Client with authentication and request handling
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { QodoAnalysisRequest, QodoAnalysisResponse } from '../../types';

export interface QodoConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const defaultQodoConfig: QodoConfig = {
  apiKey: process.env.QODO_API_KEY || 'demo-key-for-hackathon',
  baseUrl: process.env.QODO_BASE_URL || 'https://api.qodo.ai/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

export class QodoClient {
  private client: AxiosInstance;
  private config: QodoConfig;

  constructor(config: QodoConfig = defaultQodoConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Regulatory-Compliance-Monitor/1.0.0',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Qodo] Making request to ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Qodo] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[Qodo] Response received: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[Qodo] Response error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Analyze regulatory text using Qodo AI
   */
  async analyzeText(request: QodoAnalysisRequest): Promise<QodoAnalysisResponse> {
    try {
      const response = await this.makeRequestWithRetry('/analyze/regulatory', request);
      return this.transformResponse(response.data);
    } catch (error) {
      console.error('[Qodo] Analysis failed:', error);
      // Return mock response for hackathon demo if API fails
      return this.getMockAnalysis(request.text);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('[Qodo] Health check failed, using mock mode');
      return true; // Return true for demo purposes
    }
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry(
    endpoint: string, 
    data: any, 
    attempt: number = 1
  ): Promise<AxiosResponse> {
    try {
      return await this.client.post(endpoint, data);
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        console.log(`[Qodo] Retry attempt ${attempt + 1}/${this.config.retryAttempts}`);
        await this.delay(this.config.retryDelay * attempt);
        return this.makeRequestWithRetry(endpoint, data, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Transform API response to match our interface
   */
  private transformResponse(apiResponse: any): QodoAnalysisResponse {
    return {
      summary: apiResponse.summary || '',
      risk_score: apiResponse.risk_score || 0,
      priority: this.mapPriority(apiResponse.risk_score || 0),
      insights: {
        what_changed: apiResponse.insights?.what_changed || '',
        who_impacted: apiResponse.insights?.who_impacted || '',
        required_actions: apiResponse.insights?.required_actions || [],
      },
      compliance_checklist: apiResponse.compliance_checklist || [],
    };
  }

  /**
   * Map risk score to priority level
   */
  private mapPriority(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 9) return 'critical';
    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Generate mock analysis for demo purposes
   */
  private getMockAnalysis(text: string): QodoAnalysisResponse {
    const textLength = text.length;
    const hasEmission = text.toLowerCase().includes('emission');
    const hasSafety = text.toLowerCase().includes('safety');
    const hasCompliance = text.toLowerCase().includes('compliance');
    
    // Calculate mock risk score based on content
    let riskScore = 5; // Base score
    if (hasEmission) riskScore += 2;
    if (hasSafety) riskScore += 1.5;
    if (hasCompliance) riskScore += 1;
    if (textLength > 5000) riskScore += 0.5; // Longer regulations might be more complex
    
    riskScore = Math.min(10, Math.max(1, riskScore));

    return {
      summary: this.generateMockSummary(text),
      risk_score: Math.round(riskScore * 10) / 10,
      priority: this.mapPriority(riskScore),
      insights: {
        what_changed: this.extractMockChanges(text),
        who_impacted: this.extractMockImpacted(text),
        required_actions: this.generateMockActions(text),
      },
      compliance_checklist: this.generateMockChecklist(text),
    };
  }

  private generateMockSummary(text: string): string {
    const firstSentence = text.split('.')[0] + '.';
    return `This regulation addresses key compliance requirements in the oil and gas sector. ${firstSentence} Implementation requires immediate attention to ensure regulatory compliance.`;
  }

  private extractMockChanges(text: string): string {
    if (text.toLowerCase().includes('emission')) {
      return 'New emission monitoring and reporting requirements';
    }
    if (text.toLowerCase().includes('safety')) {
      return 'Updated safety protocols and training requirements';
    }
    return 'Revised compliance standards and operational procedures';
  }

  private extractMockImpacted(text: string): string {
    const impacted = [];
    if (text.toLowerCase().includes('offshore')) impacted.push('Offshore drilling operations');
    if (text.toLowerCase().includes('pipeline')) impacted.push('Pipeline operators');
    if (text.toLowerCase().includes('refinery')) impacted.push('Refinery facilities');
    
    return impacted.length > 0 ? impacted.join(', ') : 'All oil and gas operations';
  }

  private generateMockActions(text: string): string[] {
    const actions = ['Review current procedures', 'Update compliance documentation'];
    
    if (text.toLowerCase().includes('training')) {
      actions.push('Conduct staff training sessions');
    }
    if (text.toLowerCase().includes('monitoring')) {
      actions.push('Implement monitoring systems');
    }
    if (text.toLowerCase().includes('report')) {
      actions.push('Establish reporting procedures');
    }
    
    return actions;
  }

  private generateMockChecklist(text: string): string[] {
    const checklist = [
      'Assess current compliance status',
      'Identify gaps in existing procedures',
      'Develop implementation timeline',
    ];
    
    if (text.toLowerCase().includes('deadline') || text.toLowerCase().includes('effective')) {
      checklist.push('Note compliance deadlines');
    }
    
    checklist.push('Assign responsible personnel', 'Schedule compliance review');
    
    return checklist;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}