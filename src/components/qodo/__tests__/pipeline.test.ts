/**
 * Unit tests for Qodo Analysis Pipeline
 */

import { QodoAnalysisPipeline, defaultPipelineOptions } from '../pipeline';
import { QodoClient } from '../client';
import { RiskScorer } from '../risk-scoring';
import { InsightExtractor } from '../insight-extraction';
import { ComplianceChecklistGenerator } from '../compliance-checklist';

// Mock the dependencies
jest.mock('../client');
jest.mock('../risk-scoring');
jest.mock('../insight-extraction');
jest.mock('../compliance-checklist');

describe('QodoAnalysisPipeline', () => {
  let pipeline: QodoAnalysisPipeline;
  let mockClient: jest.Mocked<QodoClient>;
  let mockRiskScorer: jest.Mocked<RiskScorer>;
  let mockInsightExtractor: jest.Mocked<InsightExtractor>;
  let mockChecklistGenerator: jest.Mocked<ComplianceChecklistGenerator>;

  beforeEach(() => {
    mockClient = {
      analyzeText: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    mockRiskScorer = {
      calculateRiskScore: jest.fn(),
    } as any;
    
    mockInsightExtractor = {
      extractInsights: jest.fn(),
    } as any;
    
    mockChecklistGenerator = {
      generateChecklist: jest.fn(),
    } as any;

    pipeline = new QodoAnalysisPipeline(
      mockClient,
      mockRiskScorer,
      mockInsightExtractor,
      mockChecklistGenerator
    );

    // Setup default mock responses
    mockClient.analyzeText.mockResolvedValue({
      summary: 'Test summary',
      risk_score: 7.5,
      priority: 'high',
      insights: {
        what_changed: 'New requirements',
        who_impacted: 'All operators',
        required_actions: ['Update procedures'],
      },
      compliance_checklist: ['Review standards'],
    });

    mockRiskScorer.calculateRiskScore.mockReturnValue({
      riskScore: 7.5,
      priority: 'high',
      urgencyLevel: 6.0,
      impactLevel: 7.0,
      confidenceScore: 8.0,
    });

    mockInsightExtractor.extractInsights.mockReturnValue({
      whatChanged: 'New emission standards',
      whoImpacted: ['Offshore operators'],
      requiredActions: ['Install equipment', 'Train staff'],
      keyDeadlines: ['90 days'],
      affectedAreas: ['Drilling'],
      complianceLevel: 'high',
    });

    mockChecklistGenerator.generateChecklist.mockReturnValue({
      title: 'Test Checklist',
      totalItems: 5,
      estimatedTotalHours: 40,
      categories: ['safety', 'emission'],
      items: [
        {
          id: 'CL-001',
          task: 'Review procedures',
          description: 'Test description',
          priority: 'high',
          category: 'safety',
          estimatedHours: 8,
          dependencies: [],
          responsible: 'Safety Manager',
        },
      ],
      summary: 'Test checklist summary',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    const testText = 'New emission monitoring requirements for offshore operations.';
    const testTitle = 'Emission Standards Update';

    it('should complete full analysis pipeline successfully', async () => {
      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.regulation).toBeDefined();
      expect(result.qodoResponse).toBeDefined();
      expect(result.priorityMetrics).toBeDefined();
      expect(result.extractedInsights).toBeDefined();
      expect(result.complianceChecklist).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toBeInstanceOf(Array);

      // Verify all components were called
      expect(mockClient.analyzeText).toHaveBeenCalledWith({
        text: testText,
        analysis_type: 'regulatory_compliance',
        industry: 'oil_and_gas',
        output_format: {
          summary: true,
          risk_score: true,
          action_items: true,
          affected_parties: true,
        },
      });
      expect(mockRiskScorer.calculateRiskScore).toHaveBeenCalledWith(testText, testTitle);
      expect(mockInsightExtractor.extractInsights).toHaveBeenCalledWith(testText, testTitle);
      expect(mockChecklistGenerator.generateChecklist).toHaveBeenCalled();
    });

    it('should handle Qodo API failure gracefully', async () => {
      mockClient.analyzeText.mockRejectedValue(new Error('API Error'));

      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.errors).toContain('Qodo API error: API Error');
      expect(result.qodoResponse).toBeDefined(); // Should have fallback response
    });

    it('should handle risk scoring failure gracefully', async () => {
      mockRiskScorer.calculateRiskScore.mockImplementation(() => {
        throw new Error('Risk scoring error');
      });

      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.errors).toContain('Risk scoring error: Risk scoring error');
      expect(result.priorityMetrics).toBeDefined(); // Should have default metrics
    });

    it('should handle insight extraction failure gracefully', async () => {
      mockInsightExtractor.extractInsights.mockImplementation(() => {
        throw new Error('Insight extraction error');
      });

      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.errors).toContain('Insight extraction error: Insight extraction error');
      expect(result.extractedInsights).toBeDefined(); // Should have default insights
    });

    it('should handle checklist generation failure gracefully', async () => {
      mockChecklistGenerator.generateChecklist.mockImplementation(() => {
        throw new Error('Checklist error');
      });

      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.errors).toContain('Checklist generation error: Checklist error');
      expect(result.complianceChecklist).toBeDefined(); // Should have default checklist
    });

    it('should respect pipeline options', async () => {
      const options = {
        includeQodoAPI: false,
        generateChecklist: false,
        extractInsights: false,
        calculateRisk: false,
      };

      const result = await pipeline.analyze(testText, testTitle, undefined, options);

      expect(result).toBeDefined();
      expect(mockClient.analyzeText).not.toHaveBeenCalled();
      expect(mockRiskScorer.calculateRiskScore).not.toHaveBeenCalled();
      expect(mockInsightExtractor.extractInsights).not.toHaveBeenCalled();
      expect(mockChecklistGenerator.generateChecklist).not.toHaveBeenCalled();
    });

    it('should build regulation object correctly', async () => {
      const metadata = { source: 'EPA', date: '2025-01-01' };
      const result = await pipeline.analyze(testText, testTitle, metadata);

      expect(result.regulation.title).toBe(testTitle);
      expect(result.regulation.fullText).toBe(testText);
      expect(result.regulation.summary).toBe('Test summary');
      expect(result.regulation.riskScore).toBe(7.5);
      expect(result.regulation.priority).toBe('high');
      expect(result.regulation.status).toBe('analyzed');
      expect(result.regulation.source).toBe('EPA');
    });

    it('should calculate confidence score', async () => {
      const result = await pipeline.analyze(testText, testTitle);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(10);
    });

    it('should handle complete pipeline failure', async () => {
      // Make everything fail
      mockClient.analyzeText.mockRejectedValue(new Error('API Error'));
      mockRiskScorer.calculateRiskScore.mockImplementation(() => {
        throw new Error('Risk error');
      });
      mockInsightExtractor.extractInsights.mockImplementation(() => {
        throw new Error('Insight error');
      });
      mockChecklistGenerator.generateChecklist.mockImplementation(() => {
        throw new Error('Checklist error');
      });

      const result = await pipeline.analyze(testText, testTitle);

      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(5); // Should have low confidence
    });
  });

  describe('analyzeBatch', () => {
    const testRegulations = [
      { text: 'Regulation 1 text', title: 'Regulation 1' },
      { text: 'Regulation 2 text', title: 'Regulation 2' },
      { text: 'Regulation 3 text', title: 'Regulation 3' },
    ];

    it('should analyze multiple regulations in batch', async () => {
      const results = await pipeline.analyzeBatch(testRegulations);

      expect(results).toHaveLength(testRegulations.length);
      expect(mockClient.analyzeText).toHaveBeenCalledTimes(testRegulations.length);
    });

    it('should handle partial batch failures', async () => {
      // Make second analysis fail
      mockClient.analyzeText
        .mockResolvedValueOnce({
          summary: 'Success 1',
          risk_score: 5,
          priority: 'medium',
          insights: { what_changed: '', who_impacted: '', required_actions: [] },
          compliance_checklist: [],
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          summary: 'Success 3',
          risk_score: 6,
          priority: 'medium',
          insights: { what_changed: '', who_impacted: '', required_actions: [] },
          compliance_checklist: [],
        });

      const results = await pipeline.analyzeBatch(testRegulations);

      expect(results).toHaveLength(testRegulations.length);
      expect(results[0].regulation.summary).toBe('Success 1');
      expect(results[1].errors.length).toBeGreaterThan(0); // Should have error from API failure
      expect(results[2].regulation.summary).toBe('Success 3');
    });

    it('should process in batches with delays', async () => {
      const manyRegulations = Array(7).fill(null).map((_, i) => ({
        text: `Regulation ${i + 1} text`,
        title: `Regulation ${i + 1}`,
      }));

      const startTime = Date.now();
      const results = await pipeline.analyzeBatch(manyRegulations);
      const endTime = Date.now();

      expect(results).toHaveLength(manyRegulations.length);
      expect(endTime - startTime).toBeGreaterThan(1000); // Should have delays between batches
    });
  });

  describe('utility methods', () => {
    it('should parse who impacted correctly', () => {
      const stringInput = 'Operators, Contractors, Personnel';
      const arrayInput = ['Operators', 'Contractors', 'Personnel'];

      const stringResult = pipeline['parseWhoImpacted'](stringInput);
      const arrayResult = pipeline['parseWhoImpacted'](arrayInput);

      expect(stringResult).toEqual(['Operators', 'Contractors', 'Personnel']);
      expect(arrayResult).toEqual(['Operators', 'Contractors', 'Personnel']);
    });

    it('should handle invalid who impacted input', () => {
      const invalidInput = null;
      const result = pipeline['parseWhoImpacted'](invalidInput);

      expect(result).toEqual([]);
    });

    it('should provide default values when needed', () => {
      const defaultPriority = pipeline['getDefaultPriorityMetrics']();
      const defaultInsights = pipeline['getDefaultInsights']();
      const defaultChecklist = pipeline['getDefaultChecklist']();

      expect(defaultPriority.riskScore).toBe(5.0);
      expect(defaultPriority.priority).toBe('medium');
      expect(defaultInsights.whatChanged).toBeTruthy();
      expect(defaultChecklist.items.length).toBeGreaterThan(0);
    });
  });
});