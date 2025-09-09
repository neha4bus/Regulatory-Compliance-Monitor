/**
 * Qodo AI Analysis Pipeline - Orchestrates the complete analysis workflow
 */

import { QodoClient } from './client';
import { RiskScorer, PriorityAssigner, PriorityMetrics } from './risk-scoring';
import { InsightExtractor, ExtractedInsights } from './insight-extraction';
import { ComplianceChecklistGenerator, ComplianceChecklist } from './compliance-checklist';
import { QodoAnalysisRequest, QodoAnalysisResponse, Regulation } from '../../types';

export interface AnalysisPipelineResult {
  regulation: Partial<Regulation>;
  qodoResponse: QodoAnalysisResponse;
  priorityMetrics: PriorityMetrics;
  extractedInsights: ExtractedInsights;
  complianceChecklist: ComplianceChecklist;
  processingTime: number;
  confidence: number;
  errors: string[];
}

export interface PipelineOptions {
  includeQodoAPI: boolean;
  generateChecklist: boolean;
  extractInsights: boolean;
  calculateRisk: boolean;
  timeout: number;
}

export const defaultPipelineOptions: PipelineOptions = {
  includeQodoAPI: true,
  generateChecklist: true,
  extractInsights: true,
  calculateRisk: true,
  timeout: 45000, // 45 seconds
};

export class QodoAnalysisPipeline {
  private client: QodoClient;
  private riskScorer: RiskScorer;
  private priorityAssigner: PriorityAssigner;
  private insightExtractor: InsightExtractor;
  private checklistGenerator: ComplianceChecklistGenerator;

  constructor(
    client: QodoClient,
    riskScorer: RiskScorer,
    insightExtractor: InsightExtractor,
    checklistGenerator: ComplianceChecklistGenerator
  ) {
    this.client = client;
    this.riskScorer = riskScorer;
    this.priorityAssigner = new PriorityAssigner();
    this.insightExtractor = insightExtractor;
    this.checklistGenerator = checklistGenerator;
  }

  /**
   * Run complete analysis pipeline on regulatory text
   */
  async analyze(
    text: string,
    title?: string,
    metadata?: any,
    options: Partial<PipelineOptions> = {}
  ): Promise<AnalysisPipelineResult> {
    const startTime = Date.now();
    const opts = { ...defaultPipelineOptions, ...options };
    const errors: string[] = [];

    console.log('[Qodo Pipeline] Starting analysis pipeline');

    try {
      // Step 1: Qodo API Analysis (if enabled)
      let qodoResponse: QodoAnalysisResponse;
      if (opts.includeQodoAPI) {
        try {
          const request: QodoAnalysisRequest = {
            text: text,
            analysis_type: 'regulatory_compliance',
            industry: 'oil_and_gas',
            output_format: {
              summary: true,
              risk_score: true,
              action_items: true,
              affected_parties: true,
            },
          };
          qodoResponse = await this.client.analyzeText(request);
          console.log('[Qodo Pipeline] Qodo API analysis completed');
        } catch (error) {
          errors.push(`Qodo API error: ${error instanceof Error ? error.message : String(error)}`);
          console.warn('[Qodo Pipeline] Qodo API failed, using fallback analysis');
          qodoResponse = await this.client['getMockAnalysis'](text);
        }
      } else {
        qodoResponse = await this.client['getMockAnalysis'](text);
      }

      // Step 2: Risk Scoring and Priority Assignment
      let priorityMetrics: PriorityMetrics;
      if (opts.calculateRisk) {
        try {
          priorityMetrics = this.priorityAssigner.assignPriority(text, title, metadata);
          console.log('[Qodo Pipeline] Risk scoring completed');
        } catch (error) {
          errors.push(`Risk scoring error: ${error instanceof Error ? error.message : String(error)}`);
          priorityMetrics = this.getDefaultPriorityMetrics();
        }
      } else {
        priorityMetrics = this.getDefaultPriorityMetrics();
      }

      // Step 3: Insight Extraction
      let extractedInsights: ExtractedInsights;
      if (opts.extractInsights) {
        try {
          extractedInsights = this.insightExtractor.extractInsights(text, title);
          console.log('[Qodo Pipeline] Insight extraction completed');
        } catch (error) {
          errors.push(`Insight extraction error: ${error instanceof Error ? error.message : String(error)}`);
          extractedInsights = this.getDefaultInsights();
        }
      } else {
        extractedInsights = this.getDefaultInsights();
      }

      // Step 4: Compliance Checklist Generation
      let complianceChecklist: ComplianceChecklist;
      if (opts.generateChecklist) {
        try {
          complianceChecklist = this.checklistGenerator.generateChecklist(
            text,
            title,
            extractedInsights,
            priorityMetrics.priority
          );
          console.log('[Qodo Pipeline] Compliance checklist generated');
        } catch (error) {
          errors.push(`Checklist generation error: ${error instanceof Error ? error.message : String(error)}`);
          complianceChecklist = this.getDefaultChecklist(title);
        }
      } else {
        complianceChecklist = this.getDefaultChecklist(title);
      }

      // Step 5: Consolidate Results
      const regulation = this.buildRegulationObject(
        text,
        title,
        metadata,
        qodoResponse,
        priorityMetrics,
        extractedInsights
      );

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(
        qodoResponse,
        priorityMetrics,
        extractedInsights,
        errors
      );

      console.log(`[Qodo Pipeline] Analysis completed in ${processingTime}ms`);

      return {
        regulation,
        qodoResponse,
        priorityMetrics,
        extractedInsights,
        complianceChecklist,
        processingTime,
        confidence,
        errors,
      };

    } catch (error) {
      console.error('[Qodo Pipeline] Pipeline failed:', error);
      errors.push(`Pipeline error: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return minimal result with error information
      return this.getFailsafeResult(text, title, metadata, errors, Date.now() - startTime);
    }
  }

  /**
   * Analyze multiple regulations in batch
   */
  async analyzeBatch(
    regulations: Array<{ text: string; title?: string; metadata?: any }>,
    options: Partial<PipelineOptions> = {}
  ): Promise<AnalysisPipelineResult[]> {
    console.log(`[Qodo Pipeline] Starting batch analysis of ${regulations.length} regulations`);
    
    const results: AnalysisPipelineResult[] = [];
    const batchSize = 3; // Process in small batches to avoid overwhelming the API
    
    for (let i = 0; i < regulations.length; i += batchSize) {
      const batch = regulations.slice(i, i + batchSize);
      const batchPromises = batch.map(reg => 
        this.analyze(reg.text, reg.title, reg.metadata, options)
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        console.log(`[Qodo Pipeline] Completed batch ${Math.floor(i / batchSize) + 1}`);
        
        // Small delay between batches to be respectful to APIs
        if (i + batchSize < regulations.length) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`[Qodo Pipeline] Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        // Continue with next batch even if current batch fails
      }
    }
    
    console.log(`[Qodo Pipeline] Batch analysis completed: ${results.length}/${regulations.length} successful`);
    return results;
  }

  /**
   * Build regulation object with analysis results
   */
  private buildRegulationObject(
    text: string,
    title?: string,
    metadata?: any,
    qodoResponse?: QodoAnalysisResponse,
    priorityMetrics?: PriorityMetrics,
    insights?: ExtractedInsights
  ): Partial<Regulation> {
    return {
      title: title || 'Untitled Regulation',
      fullText: text,
      summary: qodoResponse?.summary,
      riskScore: priorityMetrics?.riskScore || qodoResponse?.risk_score,
      priority: priorityMetrics?.priority || qodoResponse?.priority,
      insights: qodoResponse?.insights ? {
        whatChanged: qodoResponse.insights.what_changed || insights?.whatChanged || '',
        whoImpacted: this.parseWhoImpacted(qodoResponse.insights.who_impacted) || insights?.whoImpacted || [],
        requiredActions: qodoResponse.insights.required_actions || insights?.requiredActions || [],
      } : undefined,
      complianceChecklist: qodoResponse?.compliance_checklist,
      status: 'analyzed',
      ...metadata,
    };
  }

  /**
   * Parse who impacted field which might be string or array
   */
  private parseWhoImpacted(whoImpacted: any): string[] {
    if (Array.isArray(whoImpacted)) {
      return whoImpacted;
    }
    if (typeof whoImpacted === 'string') {
      return whoImpacted.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    qodoResponse: QodoAnalysisResponse,
    priorityMetrics: PriorityMetrics,
    insights: ExtractedInsights,
    errors: string[]
  ): number {
    let confidence = 8; // Base confidence
    
    // Reduce confidence for each error
    confidence -= errors.length * 1.5;
    
    // Increase confidence based on data quality
    if (qodoResponse?.summary && qodoResponse.summary.length > 50) confidence += 0.5;
    if (priorityMetrics?.confidenceScore) confidence += (priorityMetrics.confidenceScore - 7) * 0.3;
    if (insights?.requiredActions && insights.requiredActions.length > 2) confidence += 0.3;
    
    return Math.max(1, Math.min(10, Math.round(confidence * 10) / 10));
  }

  /**
   * Get default priority metrics for fallback
   */
  private getDefaultPriorityMetrics(): PriorityMetrics {
    return {
      riskScore: 5.0,
      priority: 'medium',
      urgencyLevel: 5.0,
      impactLevel: 5.0,
      confidenceScore: 6.0,
    };
  }

  /**
   * Get default insights for fallback
   */
  private getDefaultInsights(): ExtractedInsights {
    return {
      whatChanged: 'Regulatory requirements updated',
      whoImpacted: ['Oil and gas operators'],
      requiredActions: ['Review compliance procedures', 'Update documentation'],
      keyDeadlines: [],
      affectedAreas: ['Operations'],
      complianceLevel: 'medium',
    };
  }

  /**
   * Get default checklist for fallback
   */
  private getDefaultChecklist(title?: string): ComplianceChecklist {
    return {
      title: `Compliance Checklist: ${title || 'Regulatory Update'}`,
      totalItems: 3,
      estimatedTotalHours: 24,
      categories: ['general'],
      items: [
        {
          id: 'CL-001',
          task: 'Review regulatory requirements',
          description: 'Conduct thorough review of new regulatory requirements',
          priority: 'high',
          category: 'general',
          estimatedHours: 8,
          dependencies: [],
          responsible: 'Compliance Manager'
        },
        {
          id: 'CL-002',
          task: 'Assess compliance gaps',
          description: 'Identify gaps between current practices and new requirements',
          priority: 'medium',
          category: 'general',
          estimatedHours: 8,
          dependencies: ['Review regulatory requirements'],
          responsible: 'Compliance Manager'
        },
        {
          id: 'CL-003',
          task: 'Develop implementation plan',
          description: 'Create detailed plan for achieving compliance',
          priority: 'medium',
          category: 'general',
          estimatedHours: 8,
          dependencies: ['Assess compliance gaps'],
          responsible: 'Compliance Manager'
        }
      ],
      summary: 'Basic compliance checklist with 3 essential tasks to address regulatory requirements.'
    };
  }

  /**
   * Get failsafe result when pipeline completely fails
   */
  private getFailsafeResult(
    text: string,
    title?: string,
    metadata?: any,
    errors: string[] = [],
    processingTime: number = 0
  ): AnalysisPipelineResult {
    return {
      regulation: {
        title: title || 'Failed Analysis',
        fullText: text,
        status: 'new',
        ...metadata,
      },
      qodoResponse: {
        summary: 'Analysis failed - manual review required',
        risk_score: 5,
        priority: 'medium',
        insights: {
          what_changed: 'Unable to determine changes',
          who_impacted: 'Manual review required',
          required_actions: ['Conduct manual analysis'],
        },
        compliance_checklist: ['Review regulation manually'],
      },
      priorityMetrics: this.getDefaultPriorityMetrics(),
      extractedInsights: this.getDefaultInsights(),
      complianceChecklist: this.getDefaultChecklist(title),
      processingTime,
      confidence: 2.0,
      errors,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}