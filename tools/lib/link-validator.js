/**
 * Link Validator - Validates internal markdown links
 *
 * Extracts and validates markdown links in documentation files,
 * ignoring external URLs and anchor-only links.
 */

import fs from 'node:fs';
import path from 'node:path';

const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Validates markdown links in content
 *
 * @param {string} content - Markdown content to validate
 * @param {string} filePath - Path to the file being validated
 * @returns {Array<{target: string, line: number, text: string}>} Array of internal links
 */
export function validateLinks(content, filePath) {
  const links = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    const regex = new RegExp(MARKDOWN_LINK_REGEX);

    while ((match = regex.exec(line)) !== null) {
      const [, text, target] = match;

      // Skip external links (http/https)
      if (target.startsWith('http://') || target.startsWith('https://')) {
        continue;
      }

      // Skip anchor-only links
      if (target.startsWith('#')) {
        continue;
      }

      links.push({
        target,
        text,
        line: index + 1,
        file: filePath
      });
    }
  });

  return links;
}

/**
 * Checks if link targets exist on filesystem
 *
 * @param {Array<{target: string, line: number, file: string}>} links - Links to check
 * @param {string} baseDir - Base directory for resolving relative paths
 * @returns {{valid: Array, broken: Array}} Categorized links
 */
export function checkLinks(links, baseDir) {
  const valid = [];
  const broken = [];

  for (const link of links) {
    const sourceDir = path.dirname(link.file);
    const targetPath = path.resolve(baseDir, sourceDir, link.target);

    if (fs.existsSync(targetPath)) {
      valid.push(link);
    } else {
      broken.push(link);
    }
  }

  return { valid, broken };
}
