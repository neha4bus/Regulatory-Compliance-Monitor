#!/usr/bin/env node

/**
 * Qodo AI Analyzer Tool for Senso MCP
 * Handles AI analysis of regulatory documents
 */

const axios = require('axios');

class QodoAnalyzerTool {
  constructor() {
    this.apiKey = process.env.QODO_API_KEY;
    this.baseUrl = process.env.QODO_API_URL || 'https://api.qodo.ai';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Analyze regulation text with Qodo AI
   */
  async analyzeRegulation(regulation, options = {}) {
    try {
      console.log(`[QodoAnalyzer] Analyzing regulation: ${regulation.id}`);

      if (!this.apiKey) {
        console.log('[QodoAnalyzer] ⚠️ No API key found, using mock analysis');
        return this.generateMockAnalysis(regulation);
      }

      const analysisRequest = {
        text: regulation.fullText,
        title: regulation.title,
        source: regulation.source,
        analysis_type: options.analysis_type || 'regulatory_compliance',
        industry: options.industry || 'oil_and_gas',
        output_format: {
          summary: true,
          risk_score: true,
          action_items: true,
          affected_parties: true,
          compliance_checklist: true,
          ...options.output_format
        },
        context: {
          regulation_date: regulation.date,
          source_url: regulation.url,
          scraped_at: regulation.scrapedAt
        }
      };

      console.log('[QodoAnalyzer] Sending request to Qodo AI...');

      const response = await axios.post(
        `${this.baseUrl}/analyze`,
        analysisRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      if (response.status !== 200) {
        throw new Error(`Qodo API returned status ${response.status}: ${response.statusText}`);
      }

      const analysis = response.data;

      console.log(`[QodoAnalyzer] ✅ Analysis complete for: ${regulation.id}`);
      console.log(`[QodoAnalyzer] Risk Score: ${analysis.risk_score}/10`);
      console.log(`[QodoAnalyzer] Priority: ${analysis.priority}`);

      return {
        success: true,
        analysis: {
          summary: analysis.summary,
          riskScore: analysis.risk_score,
          priority: analysis.priority,
          insights: {
            whatChanged: analysis.insights?.what_changed || 'Analysis not available',
            whoImpacted: analysis.insights?.who_impacted || [],
            requiredActions: analysis.insights?.required_actions || []
          },
          complianceChecklist: analysis.compliance_checklist || [],
          affectedParties: analysis.affected_parties || [],
          confidence: analysis.confidence || 0.8,
          processingTime: analysis.processing_time || 0
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          apiVersion: analysis.api_version || '1.0',
          model: analysis.model || 'qodo-regulatory-v1'
        }
      };

    } catch (error) {
      console.error(`[QodoAnalyzer] ❌ Analysis failed for ${regulation.id}:`, error.message);

      // Fallback to mock analysis on API failure
      if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
        console.log('[QodoAnalyzer] ⚠️ API unavailable, using mock analysis as fallback');
        return this.generateMockAnalysis(regulation);
      }

      return {
        success: false,
        error: error.message,
        regulationId: regulation.id
      };
    }
  }

  /**
   * Generate mock analysis for demo/testing purposes
   */
  generateMockAnalysis(regulation) {
    console.log(`[QodoAnalyzer] Generating mock analysis for: ${regulation.id}`);

    // Simulate processing delay
    const processingDelay = Math.random() * 2000 + 1000; // 1-3 seconds

    return new Promise(resolve => {
      setTimeout(() => {
        // Determine priority based on source and content
        let priority = 'medium';
        let riskScore = 5.0;

        const text = regulation.fullText.toLowerCase();
        const title = regulation.title.toLowerCase();

        // High priority indicators
        if (text.includes('immediate') || text.includes('emergency') || 
            title.includes('critical') || title.includes('urgent')) {
          priority = 'critical';
          riskScore = 9.0 + Math.random();
        } else if (text.includes('compliance required') || text.includes('mandatory') ||
                   regulation.source === 'EPA' || regulation.source === 'OSHA') {
          priority = 'high';
          riskScore = 7.0 + Math.random() * 2;
        } else if (text.includes('recommended') || text.includes('guidance')) {
          priority = 'low';
          riskScore = 2.0 + Math.random() * 3;
        } else {
          riskScore = 4.0 + Math.random() * 4;
        }

        // Generate insights based on content
        const insights = this.generateInsights(regulation, priority);
        const complianceChecklist = this.generateComplianceChecklist(regulation, priority);

        const analysis = {
          summary: this.generateSummary(regulation, priority),
          riskScore: Math.min(10, Math.max(1, riskScore)),
          priority,
          insights,
          complianceChecklist,
          affectedParties: this.getAffectedParties(regulation),
          confidence: 0.85 + Math.random() * 0.1,
          processingTime: processingDelay
        };

        console.log(`[QodoAnalyzer] ✅ Mock analysis complete for: ${regulation.id}`);
        console.log(`[QodoAnalyzer] Risk Score: ${analysis.riskScore.toFixed(1)}/10`);
        console.log(`[QodoAnalyzer] Priority: ${analysis.priority}`);

        resolve({
          success: true,
          analysis,
          metadata: {
            analyzedAt: new Date().toISOString(),
            apiVersion: 'mock-1.0',
            model: 'mock-regulatory-analyzer'
          }
        });
      }, processingDelay);
    });
  }

  /**
   * Generate summary based on regulation content
   */
  generateSummary(regulation, priority) {
    const templates = {
      critical: `URGENT: ${regulation.title} introduces critical compliance requirements that must be implemented immediately. This regulation significantly impacts oil and gas operations and requires immediate action to avoid penalties.`,
      high: `${regulation.title} establishes new regulatory requirements for oil and gas operations. Compliance is mandatory and requires systematic implementation of new procedures and controls.`,
      medium: `${regulation.title} updates existing regulatory framework with new requirements. Organizations should review current practices and implement necessary changes within the specified timeframe.`,
      low: `${regulation.title} provides updated guidance for oil and gas operations. Review recommended to ensure alignment with best practices and regulatory expectations.`
    };

    return templates[priority] || templates.medium;
  }

  /**
   * Generate insights based on regulation
   */
  generateInsights(regulation, priority) {
    const text = regulation.fullText.toLowerCase();
    
    let whatChanged = 'New regulatory requirements introduced';
    if (text.includes('emission')) whatChanged = 'New emission monitoring and reporting requirements';
    if (text.includes('safety')) whatChanged = 'Enhanced safety protocols and training requirements';
    if (text.includes('pipeline')) whatChanged = 'Updated pipeline integrity and inspection standards';
    if (text.includes('flaring')) whatChanged = 'New restrictions on gas flaring and venting operations';

    const whoImpacted = ['Oil and gas operators', 'Offshore platform operators', 'Pipeline companies'];
    if (text.includes('offshore')) whoImpacted.push('Offshore drilling contractors');
    if (text.includes('onshore')) whoImpacted.push('Onshore production facilities');
    if (text.includes('refinery')) whoImpacted.push('Refining operations');

    const requiredActions = [
      'Review current compliance status',
      'Update operational procedures',
      'Train personnel on new requirements'
    ];

    if (priority === 'critical' || priority === 'high') {
      requiredActions.unshift('Immediate compliance assessment required');
      requiredActions.push('Submit compliance plan to regulatory authority');
    }

    if (text.includes('monitoring')) {
      requiredActions.push('Install or upgrade monitoring equipment');
    }

    if (text.includes('reporting')) {
      requiredActions.push('Implement new reporting procedures');
    }

    return {
      whatChanged,
      whoImpacted,
      requiredActions
    };
  }

  /**
   * Generate compliance checklist
   */
  generateComplianceChecklist(regulation, priority) {
    const baseChecklist = [
      'Review regulation requirements and applicability',
      'Assess current compliance status',
      'Identify gaps in current procedures',
      'Develop implementation plan',
      'Update operational procedures and documentation'
    ];

    const text = regulation.fullText.toLowerCase();

    if (text.includes('training')) {
      baseChecklist.push('Develop and conduct required training programs');
    }

    if (text.includes('monitoring') || text.includes('equipment')) {
      baseChecklist.push('Procure and install required monitoring equipment');
    }

    if (text.includes('reporting')) {
      baseChecklist.push('Establish reporting procedures and schedules');
    }

    if (text.includes('inspection')) {
      baseChecklist.push('Schedule required inspections and assessments');
    }

    if (priority === 'critical' || priority === 'high') {
      baseChecklist.push('Submit compliance certification to regulatory authority');
    }

    baseChecklist.push('Monitor ongoing compliance and maintain records');

    return baseChecklist;
  }

  /**
   * Get affected parties based on regulation content
   */
  getAffectedParties(regulation) {
    const parties = ['Operations Team', 'Compliance Team', 'Safety Team'];
    
    const text = regulation.fullText.toLowerCase();
    
    if (text.includes('environmental') || text.includes('emission')) {
      parties.push('Environmental Team');
    }
    
    if (text.includes('financial') || text.includes('penalty')) {
      parties.push('Finance Team');
    }
    
    if (text.includes('legal') || text.includes('contract')) {
      parties.push('Legal Team');
    }

    return parties;
  }
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node qodo-analyzer.js <regulation-json> [options-json]');
    process.exit(1);
  }

  try {
    const regulation = JSON.parse(args[0]);
    const options = args[1] ? JSON.parse(args[1]) : {};
    
    const analyzer = new QodoAnalyzerTool();
    const result = await analyzer.analyzeRegulation(regulation, options);
    
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('[QodoAnalyzer] Fatal error:', error.message);
    process.exit(1);
  }
}

// Export class for use as module
module.exports = QodoAnalyzerTool;

// Run main function if called directly
if (require.main === module) {
  main();
}