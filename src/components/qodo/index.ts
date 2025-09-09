/**
 * Qodo AI Analysis component main export
 */

export { QodoClient, QodoConfig, defaultQodoConfig } from './client';
export { RiskScorer, PriorityAssigner } from './risk-scoring';
export { InsightExtractor } from './insight-extraction';
export { ComplianceChecklistGenerator } from './compliance-checklist';
export { QodoAnalysisPipeline } from './pipeline';

// Convenience class that combines all Qodo functionality
import { QodoClient, defaultQodoConfig } from './client';
import { RiskScorer } from './risk-scoring';
import { InsightExtractor } from './insight-extraction';
import { ComplianceChecklistGenerator } from './compliance-checklist';
import { QodoAnalysisPipeline } from './pipeline';

export class QodoService {
  private client: QodoClient;
  public riskScorer: RiskScorer;
  public insightExtractor: InsightExtractor;
  public checklistGenerator: ComplianceChecklistGenerator;
  public pipeline: QodoAnalysisPipeline;

  constructor(config = defaultQodoConfig) {
    this.client = new QodoClient(config);
    this.riskScorer = new RiskScorer();
    this.insightExtractor = new InsightExtractor();
    this.checklistGenerator = new ComplianceChecklistGenerator();
    this.pipeline = new QodoAnalysisPipeline(
      this.client,
      this.riskScorer,
      this.insightExtractor,
      this.checklistGenerator
    );
  }

  async analyzeRegulation(text: string, title?: string): Promise<any> {
    return await this.pipeline.analyze(text, title);
  }

  async healthCheck(): Promise<boolean> {
    return await this.client.healthCheck();
  }
}