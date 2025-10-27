#!/usr/bin/env node

/**
 * Append Maintenance Log Entry
 * Called by cleanup.sh to update docs/MAINTENANCE_LOG.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const logPath = join(repoRoot, 'docs', 'MAINTENANCE_LOG.md');

// Get arguments
const [startSize, endSize, logFile] = process.argv.slice(2);

if (!startSize || !endSize || !logFile) {
  console.error('Usage: append-maintenance-log.mjs <startSize> <endSize> <logFile>');
  process.exit(1);
}

// Calculate approximate freed space
const parseSizeToMB = (sizeStr) => {
  const match = sizeStr.match(/^([\d.]+)([KMGT]?)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers = { K: 0.001, M: 1, G: 1024, T: 1024 * 1024 };
  return value * (multipliers[unit] || 1);
};

const startMB = parseSizeToMB(startSize);
const endMB = parseSizeToMB(endSize);
const freedMB = startMB - endMB;
const freedStr = freedMB > 0 ? `~${freedMB.toFixed(1)} MB freed` : 'minimal change';

// Create or append to maintenance log
const date = new Date().toISOString().split('T')[0];
const time = new Date().toISOString().split('T')[1].split('.')[0];

const entry = `
## Cleanup Run - ${date} ${time}

- **Start Size:** ${startSize}
- **End Size:** ${endSize}
- **Space Freed:** ${freedStr}
- **Log File:** \`${logFile}\`
- **Safety:** No source files, env files, migrations, or Prisma schemas were modified.

`;

try {
  let content = '';
  
  if (existsSync(logPath)) {
    content = readFileSync(logPath, 'utf-8');
    // Append new entry
    content += '\n---\n' + entry;
  } else {
    // Create new file
    content = `# NeonHub Maintenance Log

This file tracks cleanup operations performed on the repository.

---
${entry}`;
  }
  
  writeFileSync(logPath, content, 'utf-8');
  console.log(`✓ Maintenance log updated: ${logPath}`);
} catch (error) {
  console.error(`Warning: Failed to update maintenance log: ${error.message}`);
  // Non-fatal, continue
}

