#!/usr/bin/env node

/**
 * Documentation Governance CLI
 *
 * Tools for maintaining documentation quality per ADR-005/006
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { validateLinks, checkLinks } from './lib/link-validator.js';
import { countInstructions } from './lib/instruction-counter.js';
import { validateAdr } from './lib/adr-validator.js';

const [,, command, ...args] = process.argv;

const COMMANDS = {
  validate: validateCommand,
  'validate-adr': validateAdrCommand,
  count: countCommand,
  help: helpCommand
};

async function main() {
  const cmd = COMMANDS[command];

  if (!cmd) {
    console.error(`Unknown command: ${command}`);
    helpCommand();
    process.exit(1);
  }

  try {
    await cmd(args);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Validate markdown links in documentation
 */
function validateCommand(args) {
  const dir = args[0] || '../.architecture';
  const basePath = resolve(dir);

  console.log(`\n📋 Validating links in ${basePath}...\n`);

  const mdFiles = findMarkdownFiles(basePath);
  let totalValid = 0;
  let totalBroken = 0;

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf8');
    const relPath = file.replace(basePath + '/', '');
    const links = validateLinks(content, relPath);

    if (links.length === 0) continue;

    const result = checkLinks(links, basePath);

    if (result.broken.length > 0) {
      console.log(`❌ ${relPath}:`);
      for (const link of result.broken) {
        console.log(`   Line ${link.line}: ${link.target}`);
      }
      totalBroken += result.broken.length;
    }

    totalValid += result.valid.length;
  }

  console.log(`\n✅ ${totalValid} valid links`);
  if (totalBroken > 0) {
    console.log(`❌ ${totalBroken} broken links\n`);
    process.exit(1);
  } else {
    console.log(`✨ All links valid!\n`);
  }
}

/**
 * Validate ADR file(s) against the framework template rules.
 * Accepts one or more file paths, or defaults to all ADRs in the repo.
 */
function validateAdrCommand(args) {
  const targets = args.length > 0
    ? args.map(a => resolve(a))
    : findAdrFiles(resolve('../.architecture/decisions/adrs'));

  let totalFailed = 0;

  for (const file of targets) {
    const filename = basename(file);
    const content = readFileSync(file, 'utf8');
    const result = validateAdr(filename, content);

    if (result.valid) {
      console.log(`✅ ${filename}`);
    } else {
      console.log(`❌ ${filename}`);
      for (const err of result.errors) {
        console.log(`   - ${err}`);
      }
      totalFailed++;
    }
  }

  if (totalFailed > 0) {
    console.log(`\n${totalFailed} ADR(s) failed validation.\n`);
    process.exit(1);
  }
  console.log(`\n✨ All ${targets.length} ADR(s) valid.\n`);
}

function findAdrFiles(dir) {
  return readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .map(name => join(dir, name));
}

/**
 * Count instructions in key documentation files
 */
function countCommand(args) {
  const files = args.length > 0 ? args : ['../AGENTS.md', '../CLAUDE.md'];

  console.log(`\n📊 Counting instructions...\n`);

  let grandTotal = 0;

  for (const file of files) {
    const path = resolve(file);
    const content = readFileSync(path, 'utf8');
    const result = countInstructions(content);

    const filename = file.split('/').pop();
    console.log(`${filename}:`);
    console.log(`  Commands:      ${result.commands.length}`);
    console.log(`  Conditionals:  ${result.conditionals.length}`);
    console.log(`  Procedures:    ${result.procedures.length}`);
    console.log(`  Guidelines:    ${result.guidelines.length}`);
    console.log(`  Total:         ${result.total}`);
    console.log('');

    grandTotal += result.total;
  }

  console.log(`Grand Total: ${grandTotal}\n`);

  // Check against targets
  if (files.includes('../AGENTS.md')) {
    const agentsContent = readFileSync(resolve('../AGENTS.md'), 'utf8');
    const agentsCount = countInstructions(agentsContent).total;
    if (agentsCount > 150) {
      console.log(`⚠️  AGENTS.md exceeds target (${agentsCount} > 150)\n`);
      process.exit(1);
    } else {
      console.log(`✅ AGENTS.md within target (${agentsCount} <= 150)\n`);
    }
  }

  if (files.includes('../CLAUDE.md')) {
    const claudeContent = readFileSync(resolve('../CLAUDE.md'), 'utf8');
    const claudeCount = countInstructions(claudeContent).total;
    if (claudeCount > 30) {
      console.log(`⚠️  CLAUDE.md exceeds target (${claudeCount} > 30)\n`);
      process.exit(1);
    } else {
      console.log(`✅ CLAUDE.md within target (${claudeCount} <= 30)\n`);
    }
  }
}

/**
 * Show help
 */
function helpCommand() {
  console.log(`
Documentation Governance Tools

Usage:
  npm run validate [dir]        Validate markdown links (default: ../.architecture)
  node cli.js validate-adr [files...]  Validate ADRs against template rules
  npm run count [files...]      Count instructions (default: ../AGENTS.md ../CLAUDE.md)

Examples:
  npm run validate
  npm run validate ../.architecture
  npm run count
  npm run count ../AGENTS.md
  npm run count ../AGENTS.md ../CLAUDE.md

Supports ADR-005/006 quarterly review process.
  `);
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden dirs
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

main();
