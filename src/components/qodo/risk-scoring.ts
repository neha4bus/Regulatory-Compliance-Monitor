/**
 * Risk scoring and priority assignment logic for regulatory analysis
 */

export interface RiskFactors {
  contentComplexity: number;
  urgencyIndicators: number;
  industryImpact: number;
  complianceRequirements: number;
  penaltyRisk: number;
}

export interface PriorityMetrics {
  riskScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgencyLevel: number;
  impactLevel: number;
  confidenceScore: number;
}

export class RiskScorer {
  private readonly RISK_WEIGHTS = {
    contentComplexity: 0.15,
    urgencyIndicators: 0.25,
    industryImpact: 0.25,
    complianceRequirements: 0.20,
    penaltyRisk: 0.15,
  };

  private readonly URGENCY_KEYWORDS = [
    'immediate', 'urgent', 'emergency', 'critical', 'deadline',
    'expires', 'effective immediately', 'must comply', 'required by',
    'violation', 'penalty', 'fine', 'enforcement'
  ];

  private readonly IMPACT_KEYWORDS = [
    'all operators', 'industry-wide', 'offshore', 'onshore',
    'drilling', 'production', 'refining', 'transportation',
    'pipeline', 'facility', 'equipment', 'personnel'
  ];

  private readonly COMPLIANCE_KEYWORDS = [
    'shall', 'must', 'required', 'mandatory', 'obligation',
    'compliance', 'certification', 'permit', 'license',
    'inspection', 'audit', 'reporting', 'documentation'
  ];

  private readonly PENALTY_KEYWORDS = [
    'penalty', 'fine', 'violation', 'enforcement', 'sanctions',
    'prosecution', 'liability', 'damages', 'cease and desist',
    'shutdown', 'suspension', 'revocation'
  ];

  /**
   * Calculate comprehensive risk score for a regulation
   */
  calculateRiskScore(text: string, title?: string): PriorityMetrics {
    const fullText = `${title || ''} ${text}`.toLowerCase();
    
    const riskFactors: RiskFactors = {
      contentComplexity: this.assessContentComplexity(text),
      urgencyIndicators: this.assessUrgencyIndicators(fullText),
      industryImpact: this.assessIndustryImpact(fullText),
      complianceRequirements: this.assessComplianceRequirements(fullText),
      penaltyRisk: this.assessPenaltyRisk(fullText),
    };

    const weightedScore = this.calculateWeightedScore(riskFactors);
    const priority = this.determinePriority(weightedScore);
    const urgencyLevel = this.calculateUrgencyLevel(riskFactors);
    const impactLevel = this.calculateImpactLevel(riskFactors);
    const confidenceScore = this.calculateConfidenceScore(text, riskFactors);

    return {
      riskScore: Math.round(weightedScore * 10) / 10,
      priority,
      urgencyLevel: Math.round(urgencyLevel * 10) / 10,
      impactLevel: Math.round(impactLevel * 10) / 10,
      confidenceScore: Math.round(confidenceScore * 10) / 10,
    };
  }

  /**
   * Assess content complexity based on text characteristics
   */
  private assessContentComplexity(text: string): number {
    const length = text.length;
    const sentences = text.split(/[.!?]+/).length;
    const avgSentenceLength = length / sentences;
    const technicalTerms = this.countTechnicalTerms(text);
    
    let complexity = 5; // Base complexity
    
    // Length factor
    if (length > 10000) complexity += 2;
    else if (length > 5000) complexity += 1;
    else if (length < 1000) complexity -= 1;
    
    // Sentence complexity
    if (avgSentenceLength > 100) complexity += 1.5;
    else if (avgSentenceLength < 50) complexity -= 0.5;
    
    // Technical terms
    complexity += Math.min(2, technicalTerms * 0.1);
    
    return Math.min(10, Math.max(1, complexity));
  }

  /**
   * Assess urgency based on time-sensitive keywords
   */
  private assessUrgencyIndicators(text: string): number {
    let urgencyScore = 0;
    
    this.URGENCY_KEYWORDS.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      urgencyScore += matches * 0.5;
    });
    
    // Check for specific date patterns
    const datePatterns = [
      /within \d+ days?/gi,
      /by \w+ \d+, \d{4}/gi,
      /effective \w+ \d+/gi,
      /deadline/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      urgencyScore += matches * 1;
    });
    
    return Math.min(10, urgencyScore);
  }

  /**
   * Assess industry impact scope
   */
  private assessIndustryImpact(text: string): number {
    let impactScore = 3; // Base impact
    
    this.IMPACT_KEYWORDS.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      impactScore += matches * 0.3;
    });
    
    // Specific high-impact indicators
    if (text.includes('all')) impactScore += 2;
    if (text.includes('industry-wide')) impactScore += 2;
    if (text.includes('nationwide')) impactScore += 1.5;
    
    return Math.min(10, impactScore);
  }

  /**
   * Assess compliance requirement severity
   */
  private assessComplianceRequirements(text: string): number {
    let complianceScore = 0;
    
    this.COMPLIANCE_KEYWORDS.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      complianceScore += matches * 0.4;
    });
    
    // Strong compliance indicators
    if (text.includes('mandatory')) complianceScore += 2;
    if (text.includes('required')) complianceScore += 1.5;
    if (text.includes('shall')) complianceScore += 1;
    
    return Math.min(10, complianceScore);
  }

  /**
   * Assess penalty and enforcement risk
   */
  private assessPenaltyRisk(text: string): number {
    let penaltyScore = 0;
    
    this.PENALTY_KEYWORDS.forEach(keyword => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      penaltyScore += matches * 0.8;
    });
    
    // Monetary penalty indicators
    const moneyPattern = /\$[\d,]+/g;
    const moneyMatches = (text.match(moneyPattern) || []).length;
    penaltyScore += moneyMatches * 1.5;
    
    return Math.min(10, penaltyScore);
  }

  /**
   * Calculate weighted risk score
   */
  private calculateWeightedScore(factors: RiskFactors): number {
    return (
      factors.contentComplexity * this.RISK_WEIGHTS.contentComplexity +
      factors.urgencyIndicators * this.RISK_WEIGHTS.urgencyIndicators +
      factors.industryImpact * this.RISK_WEIGHTS.industryImpact +
      factors.complianceRequirements * this.RISK_WEIGHTS.complianceRequirements +
      factors.penaltyRisk * this.RISK_WEIGHTS.penaltyRisk
    );
  }

  /**
   * Determine priority level based on risk score
   */
  private determinePriority(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 8.5) return 'critical';
    if (riskScore >= 6.5) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgencyLevel(factors: RiskFactors): number {
    return (factors.urgencyIndicators * 0.6 + factors.penaltyRisk * 0.4);
  }

  /**
   * Calculate impact level
   */
  private calculateImpactLevel(factors: RiskFactors): number {
    return (factors.industryImpact * 0.5 + factors.complianceRequirements * 0.5);
  }

  /**
   * Calculate confidence score based on text quality and analysis depth
   */
  private calculateConfidenceScore(text: string, factors: RiskFactors): number {
    let confidence = 7; // Base confidence
    
    // Text quality factors
    if (text.length > 1000) confidence += 1;
    if (text.length > 5000) confidence += 0.5;
    
    // Analysis depth
    const totalFactorScore = Object.values(factors).reduce((sum, val) => sum + val, 0);
    if (totalFactorScore > 25) confidence += 1;
    if (totalFactorScore > 35) confidence += 0.5;
    
    return Math.min(10, confidence);
  }

  /**
   * Count technical terms in text
   */
  private countTechnicalTerms(text: string): number {
    const technicalTerms = [
      'regulation', 'compliance', 'emission', 'environmental',
      'safety', 'hazardous', 'petroleum', 'hydrocarbon',
      'drilling', 'extraction', 'refinery', 'pipeline',
      'offshore', 'onshore', 'wellhead', 'blowout',
      'spill', 'containment', 'monitoring', 'inspection'
    ];
    
    let count = 0;
    technicalTerms.forEach(term => {
      const matches = (text.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      count += matches;
    });
    
    return count;
  }
}

export class PriorityAssigner {
  private riskScorer: RiskScorer;

  constructor() {
    this.riskScorer = new RiskScorer();
  }

  /**
   * Assign priority to a regulation based on comprehensive analysis
   */
  assignPriority(text: string, title?: string, metadata?: any): PriorityMetrics {
    const baseMetrics = this.riskScorer.calculateRiskScore(text, title);
    
    // Adjust based on metadata if available
    if (metadata) {
      baseMetrics.riskScore = this.adjustForMetadata(baseMetrics.riskScore, metadata);
      baseMetrics.priority = this.riskScorer['determinePriority'](baseMetrics.riskScore);
    }
    
    return baseMetrics;
  }

  /**
   * Adjust risk score based on additional metadata
   */
  private adjustForMetadata(baseScore: number, metadata: any): number {
    let adjustedScore = baseScore;
    
    // Source credibility adjustment
    if (metadata.source === 'EPA' || metadata.source === 'DOE') {
      adjustedScore += 0.5;
    }
    
    // Recency adjustment
    if (metadata.date) {
      const daysSincePublished = this.getDaysSince(metadata.date);
      if (daysSincePublished < 30) adjustedScore += 0.3;
      if (daysSincePublished < 7) adjustedScore += 0.2;
    }
    
    return Math.min(10, adjustedScore);
  }

  /**
   * Calculate days since a given date
   */
  private getDaysSince(date: string | Date): number {
    const targetDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}