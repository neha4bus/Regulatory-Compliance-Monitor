#!/usr/bin/env node

/**
 * Data Validator Tool for Senso MCP
 * Validates regulation data structure and completeness
 */

const { z } = require('zod');

// Define regulation schema
const RegulationSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required'),
  date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  url: z.string().url('Invalid URL format'),
  fullText: z.string().min(10, 'Full text must be at least 10 characters'),
  source: z.string().min(1, 'Source is required'),
  scrapedAt: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid scrapedAt date')
});

/**
 * Validate regulation data
 */
async function validateRegulation(data) {
  try {
    console.log('[DataValidator] Validating regulation data...');
    
    // Parse and validate the data
    const validatedData = RegulationSchema.parse(data);
    
    // Additional business logic validation
    const warnings = [];
    
    // Check if regulation is too old
    const regulationDate = new Date(validatedData.date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (regulationDate < oneYearAgo) {
      warnings.push('Regulation is older than one year');
    }
    
    // Check if full text is suspiciously short
    if (validatedData.fullText.length < 100) {
      warnings.push('Full text appears to be very short for a regulation');
    }
    
    // Check for common required fields in regulation text
    const requiredTerms = ['effective', 'compliance', 'requirement'];
    const missingTerms = requiredTerms.filter(term => 
      !validatedData.fullText.toLowerCase().includes(term)
    );
    
    if (missingTerms.length > 0) {
      warnings.push(`Missing common regulatory terms: ${missingTerms.join(', ')}`);
    }
    
    console.log('[DataValidator] ✅ Validation successful');
    if (warnings.length > 0) {
      console.log('[DataValidator] ⚠️ Warnings:', warnings);
    }
    
    return {
      success: true,
      data: validatedData,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        textLength: validatedData.fullText.length,
        regulationAge: Math.floor((Date.now() - regulationDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    };
    
  } catch (error) {
    console.error('[DataValidator] ❌ Validation failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      details: error.errors || []
    };
  }
}

/**
 * Validate multiple regulations
 */
async function validateBatch(regulations) {
  console.log(`[DataValidator] Validating batch of ${regulations.length} regulations...`);
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < regulations.length; i++) {
    const regulation = regulations[i];
    console.log(`[DataValidator] Validating regulation ${i + 1}/${regulations.length}: ${regulation.id || 'Unknown ID'}`);
    
    const result = await validateRegulation(regulation);
    results.push({
      index: i,
      regulationId: regulation.id,
      ...result
    });
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(`[DataValidator] Batch validation complete: ${successCount} success, ${errorCount} errors`);
  
  return {
    success: errorCount === 0,
    totalProcessed: regulations.length,
    successCount,
    errorCount,
    results
  };
}

/**
 * Main function for CLI usage
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node data-validator.js <regulation-json>');
    process.exit(1);
  }
  
  try {
    const inputData = JSON.parse(args[0]);
    
    let result;
    if (Array.isArray(inputData)) {
      result = await validateBatch(inputData);
    } else {
      result = await validateRegulation(inputData);
    }
    
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('[DataValidator] Fatal error:', error.message);
    process.exit(1);
  }
}

// Export functions for use as module
module.exports = {
  validateRegulation,
  validateBatch,
  RegulationSchema
};

// Run main function if called directly
if (require.main === module) {
  main();
}