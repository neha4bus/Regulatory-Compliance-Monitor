/**
 * Compliance checklist generation for regulatory requirements
 */

export interface ChecklistItem {
  id: string;
  task: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  estimatedHours: number;
  dependencies: string[];
  deadline?: string;
  responsible?: string;
}

export interface ComplianceChecklist {
  title: string;
  totalItems: number;
  estimatedTotalHours: number;
  categories: string[];
  items: ChecklistItem[];
  summary: string;
}

export class ComplianceChecklistGenerator {
  private readonly CHECKLIST_TEMPLATES = {
    emission: [
      'Review current emission monitoring systems',
      'Assess compliance with new emission limits',
      'Update emission reporting procedures',
      'Train personnel on new emission standards',
      'Install or upgrade monitoring equipment',
      'Establish emission data collection protocols'
    ],
    safety: [
      'Conduct safety risk assessment',
      'Update safety procedures and protocols',
      'Review emergency response plans',
      'Train staff on new safety requirements',
      'Inspect safety equipment and systems',
      'Document safety compliance measures'
    ],
    reporting: [
      'Review current reporting procedures',
      'Update documentation templates',
      'Establish new reporting schedules',
      'Train personnel on reporting requirements',
      'Implement data collection systems',
      'Set up compliance tracking mechanisms'
    ],
    inspection: [
      'Schedule compliance inspections',
      'Prepare inspection documentation',
      'Review inspection procedures',
      'Train inspection personnel',
      'Establish corrective action procedures',
      'Document inspection findings'
    ],
    environmental: [
      'Conduct environmental impact assessment',
      'Review environmental management plans',
      'Update environmental monitoring procedures',
      'Train staff on environmental requirements',
      'Implement environmental controls',
      'Establish environmental reporting systems'
    ],
    general: [
      'Review regulatory requirements',
      'Assess current compliance status',
      'Identify compliance gaps',
      'Develop implementation plan',
      'Assign responsible personnel',
      'Establish monitoring and review procedures'
    ]
  };

  private readonly CATEGORY_PRIORITIES = {
    safety: 'high',
    emission: 'high',
    environmental: 'medium',
    reporting: 'medium',
    inspection: 'medium',
    general: 'low'
  };

  private readonly ESTIMATED_HOURS = {
    assessment: 8,
    training: 16,
    documentation: 12,
    implementation: 24,
    monitoring: 6,
    review: 4
  };

  /**
   * Generate comprehensive compliance checklist
   */
  generateChecklist(
    text: string, 
    title?: string, 
    insights?: any, 
    riskLevel?: string
  ): ComplianceChecklist {
    const categories = this.identifyCategories(text, title);
    const items = this.generateChecklistItems(text, categories, riskLevel);
    const totalHours = items.reduce((sum, item) => sum + item.estimatedHours, 0);
    
    return {
      title: this.generateChecklistTitle(title, categories),
      totalItems: items.length,
      estimatedTotalHours: totalHours,
      categories: categories,
      items: items,
      summary: this.generateChecklistSummary(items, categories, totalHours)
    };
  }

  /**
   * Identify relevant categories from regulation text
   */
  private identifyCategories(text: string, title?: string): string[] {
    const fullText = `${title || ''} ${text}`.toLowerCase();
    const categories: Set<string> = new Set();
    
    // Check for category keywords
    if (fullText.includes('emission') || fullText.includes('pollut')) {
      categories.add('emission');
    }
    if (fullText.includes('safety') || fullText.includes('hazard') || fullText.includes('risk')) {
      categories.add('safety');
    }
    if (fullText.includes('report') || fullText.includes('document') || fullText.includes('record')) {
      categories.add('reporting');
    }
    if (fullText.includes('inspect') || fullText.includes('audit') || fullText.includes('review')) {
      categories.add('inspection');
    }
    if (fullText.includes('environment') || fullText.includes('ecological') || fullText.includes('conservation')) {
      categories.add('environmental');
    }
    
    // Always include general category
    categories.add('general');
    
    return Array.from(categories);
  }

  /**
   * Generate specific checklist items based on categories and content
   */
  private generateChecklistItems(
    text: string, 
    categories: string[], 
    riskLevel?: string
  ): ChecklistItem[] {
    const items: ChecklistItem[] = [];
    let itemId = 1;
    
    categories.forEach(category => {
      const templateItems = this.CHECKLIST_TEMPLATES[category as keyof typeof this.CHECKLIST_TEMPLATES] || this.CHECKLIST_TEMPLATES.general;
      const categoryPriority = this.adjustPriorityForRisk(
        this.CATEGORY_PRIORITIES[category as keyof typeof this.CATEGORY_PRIORITIES] || 'medium',
        riskLevel
      );
      
      templateItems.forEach((template: string) => {
        const item = this.createChecklistItem(
          itemId++,
          template,
          category,
          categoryPriority,
          text
        );
        items.push(item);
      });
    });
    
    // Add specific items based on text content
    const specificItems = this.generateSpecificItems(text, itemId);
    items.push(...specificItems);
    
    // Sort by priority and category
    return this.sortChecklistItems(items);
  }

  /**
   * Create individual checklist item
   */
  private createChecklistItem(
    id: number,
    task: string,
    category: string,
    priority: string,
    text: string
  ): ChecklistItem {
    const taskType = this.identifyTaskType(task);
    const estimatedHours = this.ESTIMATED_HOURS[taskType as keyof typeof this.ESTIMATED_HOURS] || 8;
    const deadline = this.extractDeadlineForTask(text, task);
    
    return {
      id: `CL-${id.toString().padStart(3, '0')}`,
      task: task,
      description: this.generateTaskDescription(task, category, text),
      priority: priority as 'low' | 'medium' | 'high' | 'critical',
      category: category,
      estimatedHours: estimatedHours,
      dependencies: this.identifyDependencies(task, category),
      deadline: deadline,
      responsible: this.suggestResponsible(task, category)
    };
  }

  /**
   * Generate specific items based on regulation content
   */
  private generateSpecificItems(text: string, startId: number): ChecklistItem[] {
    const items: ChecklistItem[] = [];
    const lowerText = text.toLowerCase();
    
    // Deadline-specific items
    if (lowerText.includes('deadline') || lowerText.includes('by ')) {
      items.push({
        id: `CL-${startId.toString().padStart(3, '0')}`,
        task: 'Identify and track all compliance deadlines',
        description: 'Create a comprehensive timeline of all regulatory deadlines and milestones',
        priority: 'high',
        category: 'general',
        estimatedHours: 4,
        dependencies: [],
        responsible: 'Compliance Manager'
      });
      startId++;
    }
    
    // Training-specific items
    if (lowerText.includes('training') || lowerText.includes('certification')) {
      items.push({
        id: `CL-${startId.toString().padStart(3, '0')}`,
        task: 'Develop comprehensive training program',
        description: 'Create and implement training materials for all affected personnel',
        priority: 'high',
        category: 'training',
        estimatedHours: 32,
        dependencies: ['CL-001'],
        responsible: 'Training Coordinator'
      });
      startId++;
    }
    
    // Technology/equipment items
    if (lowerText.includes('equipment') || lowerText.includes('system') || lowerText.includes('technology')) {
      items.push({
        id: `CL-${startId.toString().padStart(3, '0')}`,
        task: 'Assess equipment and technology requirements',
        description: 'Evaluate current equipment against new regulatory requirements',
        priority: 'medium',
        category: 'implementation',
        estimatedHours: 16,
        dependencies: [],
        responsible: 'Technical Manager'
      });
    }
    
    return items;
  }

  /**
   * Generate task description based on context
   */
  private generateTaskDescription(task: string, category: string, text: string): string {
    const baseDescriptions = {
      'Review current': 'Conduct a thorough review of existing procedures and identify areas that need updates to meet new regulatory requirements.',
      'Update': 'Modify and enhance current procedures to ensure full compliance with new regulatory standards.',
      'Train': 'Provide comprehensive training to all relevant personnel on new requirements and procedures.',
      'Assess': 'Evaluate current state and identify gaps between existing practices and new regulatory requirements.',
      'Implement': 'Put new procedures and systems into practice according to regulatory specifications.',
      'Establish': 'Create new procedures, systems, or protocols to meet regulatory requirements.',
      'Document': 'Create and maintain proper documentation to demonstrate compliance with regulatory requirements.',
      'Monitor': 'Set up ongoing monitoring and tracking systems to ensure continued compliance.'
    };
    
    // Find matching description pattern
    for (const [pattern, description] of Object.entries(baseDescriptions)) {
      if (task.toLowerCase().includes(pattern.toLowerCase())) {
        return description;
      }
    }
    
    return `Complete this task to ensure compliance with the new regulatory requirements in the ${category} category.`;
  }

  /**
   * Identify task type for hour estimation
   */
  private identifyTaskType(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('assess') || lowerTask.includes('review') || lowerTask.includes('evaluate')) {
      return 'assessment';
    }
    if (lowerTask.includes('train') || lowerTask.includes('educate')) {
      return 'training';
    }
    if (lowerTask.includes('document') || lowerTask.includes('record') || lowerTask.includes('report')) {
      return 'documentation';
    }
    if (lowerTask.includes('implement') || lowerTask.includes('install') || lowerTask.includes('establish')) {
      return 'implementation';
    }
    if (lowerTask.includes('monitor') || lowerTask.includes('track')) {
      return 'monitoring';
    }
    
    return 'review';
  }

  /**
   * Identify task dependencies
   */
  private identifyDependencies(task: string, category: string): string[] {
    const lowerTask = task.toLowerCase();
    const dependencies: string[] = [];
    
    // Implementation tasks typically depend on assessment
    if (lowerTask.includes('implement') || lowerTask.includes('establish')) {
      dependencies.push('Assessment and gap analysis');
    }
    
    // Training depends on updated procedures
    if (lowerTask.includes('train')) {
      dependencies.push('Updated procedures and documentation');
    }
    
    // Monitoring depends on implementation
    if (lowerTask.includes('monitor') || lowerTask.includes('track')) {
      dependencies.push('Implementation of new procedures');
    }
    
    return dependencies;
  }

  /**
   * Suggest responsible party for task
   */
  private suggestResponsible(task: string, category: string): string {
    const lowerTask = task.toLowerCase();
    
    if (category === 'safety' || lowerTask.includes('safety')) {
      return 'Safety Manager';
    }
    if (category === 'environmental' || lowerTask.includes('environmental')) {
      return 'Environmental Manager';
    }
    if (lowerTask.includes('train')) {
      return 'Training Coordinator';
    }
    if (lowerTask.includes('technical') || lowerTask.includes('equipment')) {
      return 'Technical Manager';
    }
    if (lowerTask.includes('document') || lowerTask.includes('report')) {
      return 'Documentation Specialist';
    }
    
    return 'Compliance Manager';
  }

  /**
   * Extract deadline information for specific tasks
   */
  private extractDeadlineForTask(text: string, task: string): string | undefined {
    const deadlinePatterns = [
      /(?:by|before|no later than)\s+([^.]{5,50})/gi,
      /within\s+(\d+\s+(?:days?|months?|years?))/gi,
      /deadline[:\s]+([^.]{5,50})/gi
    ];
    
    for (const pattern of deadlinePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].trim();
      }
    }
    
    return undefined;
  }

  /**
   * Adjust priority based on overall risk level
   */
  private adjustPriorityForRisk(basePriority: string, riskLevel?: string): string {
    if (!riskLevel) return basePriority;
    
    const priorityLevels = ['low', 'medium', 'high', 'critical'];
    const baseIndex = priorityLevels.indexOf(basePriority);
    const riskIndex = priorityLevels.indexOf(riskLevel);
    
    if (riskIndex > baseIndex) {
      return priorityLevels[Math.min(riskIndex, priorityLevels.length - 1)];
    }
    
    return basePriority;
  }

  /**
   * Sort checklist items by priority and category
   */
  private sortChecklistItems(items: ChecklistItem[]): ChecklistItem[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return items.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      
      // Finally by task name
      return a.task.localeCompare(b.task);
    });
  }

  /**
   * Generate checklist title
   */
  private generateChecklistTitle(title?: string, categories?: string[]): string {
    if (title) {
      return `Compliance Checklist: ${title}`;
    }
    
    if (categories && categories.length > 0) {
      const mainCategory = categories[0];
      return `${mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1)} Compliance Checklist`;
    }
    
    return 'Regulatory Compliance Checklist';
  }

  /**
   * Generate checklist summary
   */
  private generateChecklistSummary(
    items: ChecklistItem[], 
    categories: string[], 
    totalHours: number
  ): string {
    const highPriorityCount = items.filter(item => item.priority === 'high' || item.priority === 'critical').length;
    const categoryList = categories.join(', ');
    
    return `This compliance checklist contains ${items.length} tasks across ${categories.length} categories (${categoryList}). ` +
           `${highPriorityCount} tasks are marked as high or critical priority. ` +
           `Estimated total effort: ${totalHours} hours. ` +
           `Focus on high-priority items first to ensure critical compliance requirements are met.`;
  }
}