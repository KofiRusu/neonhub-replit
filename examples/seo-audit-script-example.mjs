/**
 * Example SEO Baseline Audit Script
 * 
 * This file provides a reference implementation for Codex Agent
 * to create scripts/seo-audit.mjs
 * 
 * @author Cursor Agent (Reference for Codex)
 * @date 2025-10-27
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  webAppRoot: join(projectRoot, 'apps/web/src/app'),
  publicDir: join(projectRoot, 'apps/web/public'),
  reportOutput: join(projectRoot, 'reports/SEO_BASELINE_AUDIT.json'),
  
  // SEO thresholds
  titleMinLength: 30,
  titleMaxLength: 60,
  descriptionMinLength: 120,
  descriptionMaxLength: 160,
  
  // Scoring weights
  weights: {
    metadata: 0.30,
    structure: 0.25,
    content: 0.20,
    performance: 0.15,
    technical: 0.10
  }
};

// ============================================================================
// AUDIT RESULTS
// ============================================================================

const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalPages: 0,
    pagesWithIssues: 0,
    totalIssues: 0,
    criticalIssues: 0,
    warnings: 0,
    overallScore: 0
  },
  pages: [],
  issues: {
    metadata: [],
    structure: [],
    content: [],
    performance: [],
    technical: []
  },
  recommendations: []
};

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

/**
 * Find all page.tsx files in the app directory
 */
function findPages(dir) {
  const pages = [];
  
  function walk(currentDir) {
    const files = readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = join(currentDir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (!file.startsWith('.') && file !== 'node_modules') {
          walk(fullPath);
        }
      } else if (file === 'page.tsx' || file === 'page.jsx') {
        pages.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return pages;
}

/**
 * Check if page has metadata export
 */
function checkMetadata(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Check for metadata export
  const hasMetadataExport = 
    content.includes('export const metadata') ||
    content.includes('export async function generateMetadata');
  
  if (!hasMetadataExport) {
    issues.push({
      severity: 'error',
      type: 'metadata',
      message: `Missing metadata export in ${relative(projectRoot, filePath)}`
    });
  } else {
    // Check title length (if static metadata)
    const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (titleMatch) {
      const titleLength = titleMatch[1].length;
      if (titleLength < config.titleMinLength || titleLength > config.titleMaxLength) {
        issues.push({
          severity: 'warning',
          type: 'metadata',
          message: `Title length ${titleLength} chars (ideal: ${config.titleMinLength}-${config.titleMaxLength}) in ${relative(projectRoot, filePath)}`
        });
      }
    }
    
    // Check description length
    const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) {
      const descLength = descMatch[1].length;
      if (descLength < config.descriptionMinLength || descLength > config.descriptionMaxLength) {
        issues.push({
          severity: 'warning',
          type: 'metadata',
          message: `Description length ${descLength} chars (ideal: ${config.descriptionMinLength}-${config.descriptionMaxLength}) in ${relative(projectRoot, filePath)}`
        });
      }
    }
  }
  
  return issues;
}

/**
 * Check technical SEO files
 */
function checkTechnicalFiles() {
  const issues = [];
  
  // Check robots.txt
  const robotsPath = join(config.publicDir, 'robots.txt');
  try {
    const robotsContent = readFileSync(robotsPath, 'utf-8');
    
    if (!robotsContent.includes('Sitemap:')) {
      issues.push({
        severity: 'warning',
        type: 'technical',
        message: 'robots.txt missing Sitemap reference'
      });
    }
    
    if (!robotsContent.includes('User-agent:')) {
      issues.push({
        severity: 'error',
        type: 'technical',
        message: 'robots.txt missing User-agent directive'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      type: 'technical',
      message: 'robots.txt not found'
    });
  }
  
  // Check sitemap
  const sitemapPath = join(config.webAppRoot, 'sitemap.ts');
  try {
    statSync(sitemapPath);
  } catch (error) {
    issues.push({
      severity: 'warning',
      type: 'technical',
      message: 'Dynamic sitemap (sitemap.ts) not configured'
    });
  }
  
  return issues;
}

/**
 * Calculate overall SEO score
 */
function calculateScore(issues) {
  const totalIssues = issues.length;
  const criticalIssues = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  
  // Start at 100, deduct points for issues
  let score = 100;
  score -= criticalIssues * 10;  // -10 points per error
  score -= warnings * 3;          // -3 points per warning
  
  return Math.max(0, score);
}

// ============================================================================
// MAIN AUDIT
// ============================================================================

async function main() {
  console.log('🔍 NeonHub SEO Baseline Audit');
  console.log('==============================\n');
  
  // Find all pages
  const pages = findPages(config.webAppRoot);
  auditResults.summary.totalPages = pages.length;
  
  console.log(`Found ${pages.length} pages to audit\n`);
  
  // Audit each page
  const allIssues = [];
  
  for (const page of pages) {
    const pageIssues = checkMetadata(page);
    
    if (pageIssues.length > 0) {
      auditResults.summary.pagesWithIssues++;
      allIssues.push(...pageIssues);
      
      auditResults.pages.push({
        path: relative(projectRoot, page),
        issues: pageIssues
      });
    }
  }
  
  // Check technical files
  const technicalIssues = checkTechnicalFiles();
  allIssues.push(...technicalIssues);
  
  // Categorize issues
  auditResults.summary.totalIssues = allIssues.length;
  auditResults.summary.criticalIssues = allIssues.filter(i => i.severity === 'error').length;
  auditResults.summary.warnings = allIssues.filter(i => i.severity === 'warning').length;
  
  // Calculate score
  auditResults.summary.overallScore = calculateScore(allIssues);
  
  // Group issues by type
  for (const issue of allIssues) {
    auditResults.issues[issue.type].push(issue);
  }
  
  // Generate recommendations
  if (auditResults.summary.criticalIssues > 0) {
    auditResults.recommendations.push({
      priority: 'high',
      message: `Fix ${auditResults.summary.criticalIssues} critical issue(s) immediately`,
      actions: ['Review error list', 'Add missing metadata', 'Verify technical files']
    });
  }
  
  if (auditResults.summary.warnings > 5) {
    auditResults.recommendations.push({
      priority: 'medium',
      message: `Address ${auditResults.summary.warnings} warning(s) to improve SEO`,
      actions: ['Optimize title/description lengths', 'Add alt text to images', 'Improve heading structure']
    });
  }
  
  // Print results
  console.log('\n📊 Audit Results');
  console.log('===============\n');
  console.log(`Total Pages: ${auditResults.summary.totalPages}`);
  console.log(`Pages with Issues: ${auditResults.summary.pagesWithIssues}`);
  console.log(`Total Issues: ${auditResults.summary.totalIssues}`);
  console.log(`  - Critical: ${auditResults.summary.criticalIssues}`);
  console.log(`  - Warnings: ${auditResults.summary.warnings}`);
  console.log(`\nOverall Score: ${auditResults.summary.overallScore}/100`);
  
  // Print issues
  if (allIssues.length > 0) {
    console.log('\n🔴 Issues Found:\n');
    
    for (const issue of allIssues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️ ';
      console.log(`${icon} [${issue.type.toUpperCase()}] ${issue.message}`);
    }
  }
  
  // Print recommendations
  if (auditResults.recommendations.length > 0) {
    console.log('\n💡 Recommendations:\n');
    
    for (const rec of auditResults.recommendations) {
      console.log(`[${rec.priority.toUpperCase()}] ${rec.message}`);
      rec.actions.forEach(action => console.log(`  - ${action}`));
    }
  }
  
  // Save JSON report
  // writeFileSync(config.reportOutput, JSON.stringify(auditResults, null, 2));
  // console.log(`\n📄 Full report saved to: ${config.reportOutput}`);
  
  // Exit code
  if (auditResults.summary.criticalIssues > 0) {
    console.log('\n❌ Audit failed: Critical issues found');
    process.exitCode = 1;
  } else if (auditResults.summary.warnings > 0) {
    console.log('\n⚠️  Audit passed with warnings');
    process.exitCode = 0;
  } else {
    console.log('\n✅ Audit passed: No issues found');
    process.exitCode = 0;
  }
}

main().catch(error => {
  console.error('❌ Audit failed unexpectedly:', error);
  process.exitCode = 1;
});

// ============================================================================
// NOTES FOR CODEX AGENT
// ============================================================================

/**
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. Create file: scripts/seo-audit.mjs
 * 2. Copy this code as starting point
 * 3. Enhance with additional checks:
 *    - Image alt text (scan all <img> tags)
 *    - Heading hierarchy (H1 → H2 → H3 logical order)
 *    - Internal links (count and validate)
 *    - Core Web Vitals (if possible without build)
 * 4. Test locally: node scripts/seo-audit.mjs
 * 5. Add to package.json: "seo:audit": "node scripts/seo-audit.mjs"
 * 6. Integrate into CI workflow
 * 
 * ENHANCEMENTS (Optional):
 * - Crawl live site (localhost or production)
 * - Check for broken links (404s)
 * - Validate canonical tags
 * - Check for duplicate titles/descriptions
 * - Analyze page load times
 * - Verify schema markup (JSON-LD)
 * 
 * OUTPUT:
 * - Console output (human-readable)
 * - JSON report (for programmatic use)
 * - Exit code (0 = pass, 1 = fail with errors)
 */

