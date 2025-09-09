/**
 * Sample regulatory data generator with realistic content
 */

import { v4 as uuidv4 } from 'uuid';
import { ApifyScrapedData, DataSource } from './types';

export class RegulatoryDataGenerator {
  private dataSources: DataSource[] = [
    {
      name: 'EPA',
      baseUrl: 'https://www.epa.gov/regulations',
      regulationTypes: ['Air Quality', 'Water Quality', 'Waste Management', 'Chemical Safety'],
      sampleTitles: [
        'New Emission Standards for Offshore Drilling Operations',
        'Updated Water Discharge Regulations for Oil Refineries',
        'Chemical Storage Requirements for Petroleum Facilities',
        'Air Quality Monitoring Standards for Gas Processing Plants',
        'Waste Management Protocols for Drilling Mud Disposal'
      ],
      contentTemplates: [
        'This regulation establishes new standards for {type} in oil and gas operations. Effective {date}, all facilities must comply with enhanced monitoring requirements including daily inspections, quarterly reporting, and annual third-party audits. Non-compliance may result in fines up to $50,000 per day.',
        'The Environmental Protection Agency hereby updates requirements for {type} management. All operators must implement new safety protocols within 90 days of publication. Key changes include upgraded equipment specifications, enhanced training requirements, and stricter documentation standards.',
        'New federal guidelines for {type} require immediate attention from oil and gas operators. This regulation mandates installation of advanced monitoring systems, implementation of emergency response procedures, and submission of detailed compliance reports every six months.'
      ]
    },
    {
      name: 'DOE',
      baseUrl: 'https://www.energy.gov/policy',
      regulationTypes: ['Energy Efficiency', 'Pipeline Safety', 'Export Controls', 'Grid Security'],
      sampleTitles: [
        'Pipeline Integrity Management Program Updates',
        'Energy Infrastructure Security Requirements',
        'Natural Gas Export Licensing Changes',
        'Renewable Energy Integration Standards for Oil Companies',
        'Critical Infrastructure Protection Guidelines'
      ],
      contentTemplates: [
        'The Department of Energy announces revised standards for {type} affecting all energy sector operations. Companies must demonstrate compliance through certified testing procedures, maintain detailed operational logs, and participate in mandatory industry safety programs.',
        'Updated federal requirements for {type} take effect immediately. All energy companies must review current practices, update safety protocols, and ensure personnel receive appropriate training. Failure to comply may result in operational restrictions.',
        'New Department of Energy regulations establish comprehensive {type} standards. Operators must conduct risk assessments, implement mitigation strategies, and maintain continuous monitoring systems to ensure public safety and environmental protection.'
      ]
    },
    {
      name: 'Texas Railroad Commission',
      baseUrl: 'https://www.rrc.texas.gov/rules',
      regulationTypes: ['Well Completion', 'Production Reporting', 'Surface Damage', 'Plugging Requirements'],
      sampleTitles: [
        'Enhanced Well Completion Reporting Requirements',
        'Updated Surface Damage Restoration Standards',
        'New Production Data Submission Protocols',
        'Revised Well Plugging and Abandonment Rules',
        'Groundwater Protection Measures for Drilling Operations'
      ],
      contentTemplates: [
        'The Railroad Commission of Texas hereby establishes new requirements for {type} in all oil and gas operations within state jurisdiction. Operators must submit detailed documentation, maintain comprehensive records, and ensure compliance with all safety standards.',
        'Effective immediately, all Texas oil and gas operators must comply with updated {type} regulations. These changes require enhanced monitoring, improved reporting procedures, and stricter adherence to environmental protection standards.',
        'New state regulations for {type} require immediate implementation across all Texas oil and gas facilities. Operators must update procedures, train personnel, and maintain detailed compliance documentation for regulatory review.'
      ]
    },
    {
      name: 'API',
      baseUrl: 'https://www.api.org/standards',
      regulationTypes: ['Safety Standards', 'Equipment Specifications', 'Best Practices', 'Training Requirements'],
      sampleTitles: [
        'Updated API Safety Standards for Offshore Operations',
        'New Equipment Certification Requirements',
        'Enhanced Personnel Training Standards',
        'Revised Best Practices for Well Control',
        'Updated Standards for Pipeline Maintenance'
      ],
      contentTemplates: [
        'The American Petroleum Institute releases updated industry standards for {type}. All member companies should review current practices, implement recommended changes, and ensure personnel receive appropriate training on new requirements.',
        'New API standards for {type} establish comprehensive guidelines for oil and gas operations. Companies are encouraged to adopt these practices to maintain industry leadership in safety and environmental stewardship.',
        'Updated industry standards for {type} provide detailed guidance for oil and gas operators. Implementation of these standards demonstrates commitment to operational excellence and regulatory compliance.'
      ]
    }
  ];

  /**
   * Generate realistic regulatory data for demo purposes
   */
  public generateSampleData(count: number = 5): ApifyScrapedData[] {
    const regulations: ApifyScrapedData[] = [];
    
    for (let i = 0; i < count; i++) {
      const source = this.getRandomSource();
      const regulationType = this.getRandomElement(source.regulationTypes);
      const title = this.getRandomElement(source.sampleTitles);
      const template = this.getRandomElement(source.contentTemplates);
      
      const regulation: ApifyScrapedData = {
        id: uuidv4(),
        title: title,
        date: this.generateRecentDate(),
        url: `${source.baseUrl}/${this.generateUrlSlug(title)}`,
        fullText: this.generateFullText(template, regulationType),
        source: source.name,
        scrapedAt: new Date().toISOString()
      };
      
      regulations.push(regulation);
    }
    
    return regulations;
  }

  /**
   * Generate data for a specific source
   */
  public generateDataForSource(sourceName: string, count: number = 3): ApifyScrapedData[] {
    const source = this.dataSources.find(s => s.name === sourceName);
    if (!source) {
      throw new Error(`Unknown data source: ${sourceName}`);
    }

    const regulations: ApifyScrapedData[] = [];
    
    for (let i = 0; i < count; i++) {
      const regulationType = this.getRandomElement(source.regulationTypes);
      const title = this.getRandomElement(source.sampleTitles);
      const template = this.getRandomElement(source.contentTemplates);
      
      const regulation: ApifyScrapedData = {
        id: uuidv4(),
        title: title,
        date: this.generateRecentDate(),
        url: `${source.baseUrl}/${this.generateUrlSlug(title)}`,
        fullText: this.generateFullText(template, regulationType),
        source: source.name,
        scrapedAt: new Date().toISOString()
      };
      
      regulations.push(regulation);
    }
    
    return regulations;
  }

  /**
   * Get available data sources
   */
  public getAvailableSources(): string[] {
    return this.dataSources.map(source => source.name);
  }

  private getRandomSource(): DataSource {
    return this.getRandomElement(this.dataSources);
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateRecentDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30); // Within last 30 days
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return date.toISOString().split('T')[0];
  }

  private generateUrlSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateFullText(template: string, regulationType: string): string {
    const effectiveDate = this.generateFutureDate();
    let fullText = template
      .replace('{type}', regulationType.toLowerCase())
      .replace('{date}', effectiveDate);

    // Add additional realistic content
    const additionalSections = [
      '\n\nSCOPE AND APPLICABILITY:\nThis regulation applies to all oil and gas operations including exploration, production, refining, and transportation activities within the specified jurisdiction.',
      '\n\nCOMPLIANCE TIMELINE:\nOperators have 180 days from the effective date to achieve full compliance. Interim reporting requirements begin 60 days after publication.',
      '\n\nENFORCEMENT:\nViolations of this regulation may result in civil penalties, operational restrictions, or permit revocation. Repeat offenders may face enhanced penalties.',
      '\n\nREPORTING REQUIREMENTS:\nAll affected operators must submit quarterly compliance reports detailing implementation progress, monitoring results, and any incidents or deviations.'
    ];

    // Add 2-3 random additional sections
    const sectionsToAdd = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < sectionsToAdd; i++) {
      fullText += this.getRandomElement(additionalSections);
    }

    return fullText;
  }

  private generateFutureDate(): string {
    const now = new Date();
    const daysFromNow = Math.floor(Math.random() * 180) + 30; // 30-210 days from now
    const date = new Date(now.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}