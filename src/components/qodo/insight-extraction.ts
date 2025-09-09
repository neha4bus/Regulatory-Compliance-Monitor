/**
 * Insight extraction for regulatory analysis
 * Extracts what changed, who is impacted, and required actions
 */

export interface ExtractedInsights {
  whatChanged: string;
  whoImpacted: string[];
  requiredActions: string[];
  keyDeadlines: string[];
  affectedAreas: string[];
  complianceLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class InsightExtractor {
  private readonly CHANGE_INDICATORS = [
    'new', 'updated', 'revised', 'amended', 'modified', 'changed',
    'introduced', 'established', 'implemented', 'effective',
    'replaces', 'supersedes', 'cancels', 'terminates'
  ];

  private readonly IMPACT_ENTITIES = [
    'operators', 'companies', 'facilities', 'personnel', 'contractors',
    'offshore operations', 'onshore operations', 'drilling operations',
    'production facilities', 'refineries', 'pipelines', 'terminals',
    'storage facilities', 'transportation', 'distribution'
  ];

  private readonly ACTION_VERBS = [
    'must', 'shall', 'required to', 'need to', 'should',
    'implement', 'establish', 'maintain', 'conduct', 'perform',
    'submit', 'report', 'notify', 'comply', 'ensure',
    'install', 'upgrade', 'train', 'certify', 'inspect'
  ];

  private readonly OIL_GAS_AREAS = [
    'drilling', 'exploration', 'production', 'refining', 'transportation',
    'storage', 'distribution', 'offshore', 'onshore', 'pipeline',
    'wellhead', 'platform', 'rig', 'facility', 'terminal'
  ];

  /**
   * Extract comprehensive insights from regulatory text
   */
  extractInsights(text: string, title?: string): ExtractedInsights {
    const fullText = `${title || ''} ${text}`;
    
    return {
      whatChanged: this.extractWhatChanged(fullText),
      whoImpacted: this.extractWhoImpacted(fullText),
      requiredActions: this.extractRequiredActions(fullText),
      keyDeadlines: this.extractKeyDeadlines(fullText),
      affectedAreas: this.extractAffectedAreas(fullText),
      complianceLevel: this.assessComplianceLevel(fullText),
    };
  }

  /**
   * Extract what has changed in the regulation
   */
  private extractWhatChanged(text: string): string {
    const lowerText = text.toLowerCase();
    const changes: string[] = [];
    
    // Look for explicit change statements
    const changePatterns = [
      /(?:new|updated|revised|amended|modified|changed|introduced|established|implemented)\s+([^.]{10,100})/gi,
      /(?:this regulation|this rule|this standard)\s+([^.]{10,100})/gi,
      /(?:effective|beginning|starting)\s+([^.]{10,100})/gi
    ];
    
    changePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = this.cleanExtractedText(match);
          if (cleaned.length > 10) {
            changes.push(cleaned);
          }
        });
      }
    });
    
    // If no explicit changes found, infer from content
    if (changes.length === 0) {
      changes.push(this.inferChangesFromContent(lowerText));
    }
    
    // Return the most relevant change or combine multiple changes
    return changes.length > 0 ? this.consolidateChanges(changes) : 'Regulatory updates affecting oil and gas operations';
  }

  /**
   * Extract who is impacted by the regulation
   */
  private extractWhoImpacted(text: string): string[] {
    const lowerText = text.toLowerCase();
    const impacted: Set<string> = new Set();
    
    // Direct entity mentions
    this.IMPACT_ENTITIES.forEach(entity => {
      if (lowerText.includes(entity)) {
        impacted.add(this.capitalizeFirst(entity));
      }
    });
    
    // Pattern-based extraction
    const impactPatterns = [
      /(?:all|any)\s+([a-z\s]+(?:operator|company|facility|personnel))/gi,
      /([a-z\s]+(?:operator|company|facility|personnel))\s+(?:must|shall|are required)/gi,
      /(?:applies to|affects|impacts)\s+([^.]{10,50})/gi
    ];
    
    impactPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = this.cleanExtractedText(match);
          if (cleaned.length > 5 && cleaned.length < 50) {
            impacted.add(this.capitalizeFirst(cleaned));
          }
        });
      }
    });
    
    // If no specific entities found, add general categories
    if (impacted.size === 0) {
      impacted.add('Oil and gas operators');
      if (lowerText.includes('offshore')) impacted.add('Offshore operations');
      if (lowerText.includes('onshore')) impacted.add('Onshore operations');
    }
    
    return Array.from(impacted).slice(0, 5); // Limit to 5 most relevant
  }

  /**
   * Extract required actions from the regulation
   */
  private extractRequiredActions(text: string): string[] {
    const actions: Set<string> = new Set();
    
    // Pattern-based action extraction
    const actionPatterns = [
      /(?:must|shall|required to|need to)\s+([^.]{10,100})/gi,
      /(?:operator|company|facility|personnel)\s+(?:must|shall)\s+([^.]{10,100})/gi,
      /(?:implement|establish|maintain|conduct|perform|submit|report|notify|comply|ensure|install|upgrade|train|certify|inspect)\s+([^.]{10,100})/gi
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = this.cleanExtractedText(match);
          const action = this.formatAction(cleaned);
          if (action.length > 10 && action.length < 150) {
            actions.add(action);
          }
        });
      }
    });
    
    // Add common compliance actions if none found
    if (actions.size === 0) {
      actions.add('Review current compliance procedures');
      actions.add('Update operational documentation');
      actions.add('Train relevant personnel');
    }
    
    return Array.from(actions).slice(0, 8); // Limit to 8 most important actions
  }

  /**
   * Extract key deadlines from the regulation
   */
  private extractKeyDeadlines(text: string): string[] {
    const deadlines: Set<string> = new Set();
    
    const deadlinePatterns = [
      /(?:by|before|no later than|deadline|due date|effective)\s+([^.]{5,50}(?:\d{4}|days?|months?|years?))/gi,
      /within\s+(\d+\s+(?:days?|months?|years?))/gi,
      /(?:effective|beginning|starting)\s+([^.]{5,50})/gi
    ];
    
    deadlinePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = this.cleanExtractedText(match);
          if (cleaned.length > 5 && cleaned.length < 100) {
            deadlines.add(cleaned);
          }
        });
      }
    });
    
    return Array.from(deadlines).slice(0, 5);
  }

  /**
   * Extract affected operational areas
   */
  private extractAffectedAreas(text: string): string[] {
    const lowerText = text.toLowerCase();
    const areas: Set<string> = new Set();
    
    this.OIL_GAS_AREAS.forEach(area => {
      if (lowerText.includes(area)) {
        areas.add(this.capitalizeFirst(area));
      }
    });
    
    // Add specific area patterns
    const areaPatterns = [
      /(?:upstream|midstream|downstream)\s+operations/gi,
      /(?:exploration|production|refining|transportation|distribution)\s+activities/gi
    ];
    
    areaPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          areas.add(this.capitalizeFirst(match.trim()));
        });
      }
    });
    
    return Array.from(areas).slice(0, 6);
  }

  /**
   * Assess compliance level required
   */
  private assessComplianceLevel(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // High-impact indicators
    if (lowerText.includes('mandatory')) score += 3;
    if (lowerText.includes('required')) score += 2;
    if (lowerText.includes('shall')) score += 2;
    if (lowerText.includes('must')) score += 2;
    if (lowerText.includes('penalty')) score += 3;
    if (lowerText.includes('violation')) score += 3;
    if (lowerText.includes('enforcement')) score += 2;
    if (lowerText.includes('immediate')) score += 4;
    if (lowerText.includes('critical')) score += 4;
    
    if (score >= 12) return 'critical';
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Infer changes from content when explicit changes aren't found
   */
  private inferChangesFromContent(text: string): string {
    if (text.includes('emission')) return 'New emission standards and monitoring requirements';
    if (text.includes('safety')) return 'Updated safety protocols and procedures';
    if (text.includes('environmental')) return 'Enhanced environmental protection measures';
    if (text.includes('reporting')) return 'Modified reporting and documentation requirements';
    if (text.includes('inspection')) return 'Revised inspection and audit procedures';
    return 'Updated regulatory compliance requirements';
  }

  /**
   * Consolidate multiple changes into a coherent summary
   */
  private consolidateChanges(changes: string[]): string {
    if (changes.length === 1) return changes[0];
    
    // Group similar changes
    const grouped = this.groupSimilarChanges(changes);
    
    // Return the most comprehensive change or combine top changes
    if (grouped.length === 1) return grouped[0];
    return grouped.slice(0, 2).join('; ');
  }

  /**
   * Group similar changes together
   */
  private groupSimilarChanges(changes: string[]): string[] {
    // Simple grouping by key terms - could be enhanced with more sophisticated NLP
    const groups: { [key: string]: string[] } = {};
    
    changes.forEach(change => {
      const key = this.getChangeCategory(change);
      if (!groups[key]) groups[key] = [];
      groups[key].push(change);
    });
    
    // Return the longest change from each group
    return Object.values(groups).map(group => 
      group.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      )
    );
  }

  /**
   * Categorize change by content
   */
  private getChangeCategory(change: string): string {
    const lower = change.toLowerCase();
    if (lower.includes('emission') || lower.includes('environmental')) return 'environmental';
    if (lower.includes('safety') || lower.includes('hazard')) return 'safety';
    if (lower.includes('report') || lower.includes('document')) return 'reporting';
    if (lower.includes('inspect') || lower.includes('audit')) return 'inspection';
    return 'general';
  }

  /**
   * Format action text for better readability
   */
  private formatAction(action: string): string {
    let formatted = action.trim();
    
    // Ensure it starts with a capital letter
    formatted = this.capitalizeFirst(formatted);
    
    // Remove redundant words at the beginning
    formatted = formatted.replace(/^(?:must|shall|required to|need to)\s+/i, '');
    
    // Ensure it's a proper action statement
    if (!formatted.match(/^[A-Z]/)) {
      formatted = this.capitalizeFirst(formatted);
    }
    
    return formatted;
  }

  /**
   * Clean extracted text by removing unwanted characters and formatting
   */
  private cleanExtractedText(text: string): string {
    return text
      .replace(/[^\w\s.,;:-]/g, '') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}