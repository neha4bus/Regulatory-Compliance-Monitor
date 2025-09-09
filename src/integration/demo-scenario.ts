/**
 * Demo Scenario Generator
 * Creates realistic regulatory changes for hackathon demonstration
 */

import { ApifyScrapedData } from '../types';

export interface DemoScenario {
  name: string;
  description: string;
  regulations: ApifyScrapedData[];
  expectedOutcomes: {
    highPriorityCount: number;
    totalActionItems: number;
    affectedOperations: string[];
  };
}

export class DemoScenarioGenerator {
  /**
   * Generate a comprehensive demo scenario with realistic regulatory changes
   */
  static generateHackathonDemo(): DemoScenario {
    const regulations: ApifyScrapedData[] = [
      {
        id: 'epa-2025-001',
        title: 'New Offshore Drilling Emission Standards - Immediate Compliance Required',
        date: '2025-01-08',
        url: 'https://www.epa.gov/regulations/offshore-emissions-2025',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: `
ENVIRONMENTAL PROTECTION AGENCY
40 CFR Part 435

New Offshore Drilling Emission Standards

SUMMARY: The Environmental Protection Agency (EPA) is establishing new emission standards for offshore oil and gas drilling operations. These standards require immediate implementation of enhanced monitoring systems and reduction of methane emissions by 40% within 90 days.

EFFECTIVE DATE: This rule is effective March 1, 2025.

KEY REQUIREMENTS:
1. Installation of continuous emission monitoring systems (CEMS) on all offshore platforms
2. Implementation of leak detection and repair (LDAR) programs with monthly inspections
3. Reduction of methane emissions by 40% from 2024 baseline levels
4. Quarterly reporting of emission data to EPA regional offices
5. Mandatory training for all platform personnel on new emission control procedures

COMPLIANCE TIMELINE:
- 30 days: Submit compliance plan to EPA
- 60 days: Begin CEMS installation
- 90 days: Achieve 40% methane reduction target
- 120 days: Complete all system installations

PENALTIES: Non-compliance may result in fines up to $50,000 per day per violation and potential suspension of drilling permits.

This regulation affects approximately 2,500 offshore platforms in the Gulf of Mexico and requires estimated compliance costs of $2.3 billion industry-wide.
        `
      },
      {
        id: 'doe-2025-002',
        title: 'Enhanced Pipeline Safety Inspection Requirements',
        date: '2025-01-07',
        url: 'https://www.energy.gov/policy/pipeline-safety-2025',
        source: 'DOE',
        scrapedAt: new Date().toISOString(),
        fullText: `
DEPARTMENT OF ENERGY
Pipeline and Hazardous Materials Safety Administration

Enhanced Pipeline Safety Inspection Requirements

SUMMARY: New mandatory inspection protocols for oil and gas pipelines, requiring advanced integrity assessment technologies and increased inspection frequency for high-consequence areas.

EFFECTIVE DATE: June 1, 2025

REQUIREMENTS:
1. Bi-annual integrity assessments using inline inspection tools for all transmission pipelines
2. Implementation of real-time monitoring systems for pressure and flow anomalies
3. Enhanced corrosion protection measures in environmentally sensitive areas
4. Mandatory third-party verification of all inspection results
5. Updated emergency response plans with community notification systems

AFFECTED INFRASTRUCTURE:
- 185,000 miles of transmission pipelines
- 2.2 million miles of distribution pipelines
- All pipeline operators with systems in high-consequence areas

COMPLIANCE COSTS: Estimated $1.8 billion for initial implementation, $400 million annually for ongoing compliance.

TRAINING REQUIREMENTS: All inspection personnel must complete 40-hour certification program by May 1, 2025.
        `
      },
      {
        id: 'tx-rrc-2025-003',
        title: 'Texas Railroad Commission - New Flaring Restrictions',
        date: '2025-01-06',
        url: 'https://www.rrc.texas.gov/regulations/flaring-2025',
        source: 'Texas Railroad Commission',
        scrapedAt: new Date().toISOString(),
        fullText: `
TEXAS RAILROAD COMMISSION
Rule 3.32 - Gas Flaring and Venting

New Flaring Restrictions for Oil and Gas Operations

SUMMARY: The Texas Railroad Commission is implementing stricter limits on routine flaring and venting of natural gas from oil and gas operations, effective April 15, 2025.

KEY PROVISIONS:
1. Routine flaring prohibited except during emergencies and maintenance
2. Maximum 48-hour flaring period for well completions and workovers
3. Mandatory gas capture systems for all new wells
4. Monthly reporting of all flaring and venting activities
5. Economic penalties for excessive flaring: $1,000 per thousand cubic feet

EXEMPTIONS:
- Emergency safety situations
- Equipment malfunction (limited to 24 hours)
- Wells producing less than 15 barrels per day

IMPLEMENTATION TIMELINE:
- February 15: Submit gas capture plans
- March 15: Begin installation of capture systems
- April 15: Full compliance required

This rule affects approximately 15,000 active wells in Texas and is expected to reduce flared gas by 85%.
        `
      },
      {
        id: 'boem-2025-004',
        title: 'Bureau of Ocean Energy Management - Renewable Energy Transition Requirements',
        date: '2025-01-05',
        url: 'https://www.boem.gov/renewable-energy/transition-requirements-2025',
        source: 'BOEM',
        scrapedAt: new Date().toISOString(),
        fullText: `
BUREAU OF OCEAN ENERGY MANAGEMENT
30 CFR Part 585

Renewable Energy Transition Requirements for Offshore Operations

SUMMARY: New requirements for offshore oil and gas operators to develop renewable energy transition plans and invest in clean energy infrastructure.

EFFECTIVE DATE: July 1, 2025

REQUIREMENTS:
1. Submit 10-year renewable energy transition plan by June 1, 2025
2. Allocate minimum 15% of annual revenue to renewable energy projects
3. Install renewable energy systems on 25% of offshore platforms by 2027
4. Participate in offshore wind development partnerships
5. Establish $100 million decommissioning fund for platform-to-renewable conversions

TRANSITION INCENTIVES:
- 20% reduction in lease renewal fees for compliant operators
- Priority consideration for offshore wind lease areas
- Tax credits for renewable energy investments

REPORTING REQUIREMENTS:
- Quarterly progress reports on transition activities
- Annual third-party verification of renewable energy investments
- Public disclosure of transition plan milestones

This regulation affects all 23 major offshore operators in federal waters and represents a fundamental shift in offshore energy policy.
        `
      },
      {
        id: 'osha-2025-005',
        title: 'OSHA - Enhanced Workplace Safety Standards for Oil and Gas',
        date: '2025-01-04',
        url: 'https://www.osha.gov/oil-gas-safety-2025',
        source: 'OSHA',
        scrapedAt: new Date().toISOString(),
        fullText: `
OCCUPATIONAL SAFETY AND HEALTH ADMINISTRATION
29 CFR Part 1910

Enhanced Workplace Safety Standards for Oil and Gas Operations

SUMMARY: Comprehensive update to workplace safety requirements for oil and gas operations, including new personal protective equipment standards and emergency response protocols.

EFFECTIVE DATE: May 1, 2025

NEW SAFETY REQUIREMENTS:
1. Mandatory gas detection systems in all confined spaces
2. Enhanced fall protection for workers at heights above 4 feet
3. Improved emergency evacuation procedures with quarterly drills
4. Advanced first aid training for all supervisory personnel
5. Real-time health monitoring for workers exposed to hazardous substances

PERSONAL PROTECTIVE EQUIPMENT:
- Upgraded respiratory protection in hydrogen sulfide environments
- Cut-resistant gloves for all drilling operations
- High-visibility clothing with integrated communication systems
- Emergency escape breathing apparatus for all platform workers

TRAINING REQUIREMENTS:
- 16-hour initial safety certification for new workers
- 8-hour annual refresher training for all personnel
- Specialized training for emergency response team members

INSPECTION FREQUENCY: OSHA will conduct unannounced inspections at 25% of facilities annually, with increased penalties for violations.

This standard affects approximately 150,000 oil and gas workers nationwide.
        `
      }
    ];

    return {
      name: 'Hackathon Demo - Regulatory Compliance Crisis',
      description: 'A realistic scenario showing multiple high-impact regulatory changes requiring immediate attention and coordinated response',
      regulations,
      expectedOutcomes: {
        highPriorityCount: 3, // EPA, Texas RRC, and OSHA regulations
        totalActionItems: 25, // Estimated total action items across all regulations
        affectedOperations: [
          'Offshore Drilling Platforms',
          'Pipeline Operations',
          'Texas Oil Wells',
          'Renewable Energy Transition',
          'Worker Safety Programs'
        ]
      }
    };
  }

  /**
   * Generate a simpler demo for quick testing
   */
  static generateQuickDemo(): DemoScenario {
    const regulations: ApifyScrapedData[] = [
      {
        id: 'demo-001',
        title: 'Emergency Emission Control Update',
        date: '2025-01-08',
        url: 'https://demo.epa.gov/emergency-update',
        source: 'EPA',
        scrapedAt: new Date().toISOString(),
        fullText: `
EMERGENCY REGULATORY UPDATE

New emission control requirements effective immediately:
1. Install monitoring equipment within 30 days
2. Reduce emissions by 25% within 60 days
3. Submit compliance reports monthly

This affects all offshore operations and requires immediate action.
        `
      },
      {
        id: 'demo-002',
        title: 'Safety Protocol Enhancement',
        date: '2025-01-07',
        url: 'https://demo.osha.gov/safety-update',
        source: 'OSHA',
        scrapedAt: new Date().toISOString(),
        fullText: `
SAFETY PROTOCOL ENHANCEMENT

Updated safety requirements:
1. Enhanced personal protective equipment
2. Additional safety training required
3. New emergency response procedures

Implementation deadline: March 1, 2025
        `
      }
    ];

    return {
      name: 'Quick Demo - Basic Compliance Updates',
      description: 'Simple scenario for quick testing and demonstration',
      regulations,
      expectedOutcomes: {
        highPriorityCount: 1,
        totalActionItems: 6,
        affectedOperations: ['Offshore Operations', 'Safety Programs']
      }
    };
  }

  /**
   * Get demo scenario by name
   */
  static getScenario(name: 'hackathon' | 'quick'): DemoScenario {
    switch (name) {
      case 'hackathon':
        return this.generateHackathonDemo();
      case 'quick':
        return this.generateQuickDemo();
      default:
        return this.generateQuickDemo();
    }
  }
}