/**
 * Instruction Counter - Counts discrete instructions in documentation
 *
 * Implements the methodology defined in .architecture/instruction-counting-methodology.md
 * to count actionable directives for AI assistants while ignoring informational content.
 */

/**
 * Patterns for identifying different instruction types
 */
const PATTERNS = {
  // Commands: Directive statements (quoted or in list items)
  commands: /(?:[""]\s*)?(Create|Follow|Apply|Check|Use|Run|Install|Update|Document)\s+[^"\n]+(?:[""]\s*)?/gi,

  // Conditionals: If/When/Unless statements
  conditionals: /(?:^|\n)\s*(?:If|When|Unless|While)\s+[^:\n]+:/gim,

  // Procedures: Numbered or bulleted steps with action verbs
  procedures: /(?:^|\n)\s*(?:\d+\.|-|\*)\s+([A-Z][a-z]+)\s+[^\n]+/g,

  // Guidelines: Keep/Never/Must/Always statements
  guidelines: /(?:^|\n)\s*[-*]?\s*(?:Keep|Never|Must|Always|Should|Do not)\s+[^\n]+/gim,

  // Headings: Markdown headings (to exclude)
  headings: /^#+\s+.+$/gm
};

/**
 * Non-instruction patterns to filter out
 */
const EXCLUSIONS = {
  // Informational sentences
  informational: /(?:provides|contains|describes|explains|includes|is|was|are|were)\s/i,

  // Examples
  examples: /(?:^|\n)\s*(?:Example|For example|e\.g\.|Such as):/gi,

  // Human-only references
  humanRefs: /(?:For more|See also|Additional|Reference|Learn more)/gi
};

/**
 * Counts instructions in markdown content
 *
 * @param {string} content - Markdown content to analyze
 * @returns {{commands: Array, conditionals: Array, procedures: Array, guidelines: Array, total: number}}
 */
export function countInstructions(content) {
  // Remove headings first
  let workingContent = content.replace(PATTERNS.headings, '');

  const result = {
    commands: [],
    conditionals: [],
    procedures: [],
    guidelines: [],
    total: 0
  };

  // Process line by line for better control
  const lines = workingContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isExcluded(line)) continue;

    // Check conditionals first (most specific)
    if (/^[-*]?\s*(?:If|When|Unless|While)\s+[^:]+:/i.test(trimmed)) {
      result.conditionals.push(trimmed);
      continue;
    }

    // Check procedures (NUMBERED steps only, not bullets)
    const procMatch = trimmed.match(/^(\d+\.)\s+([A-Z][a-z]+)\s+(.+)/);
    if (procMatch && isActionVerb(procMatch[2])) {
      result.procedures.push(trimmed);
      continue;
    }

    // Check guidelines
    if (/^[-*]?\s*(?:Keep|Never|Must|Always|Should|Do not)\s+/i.test(trimmed)) {
      result.guidelines.push(trimmed);
      continue;
    }

    // Check commands (quoted or list items with action verbs)
    if (/^[-*]?\s*(?:Create|Follow|Apply|Check|Use|Run|Install|Update|Document)\s+/i.test(trimmed)) {
      result.commands.push(trimmed);
      continue;
    }
  }

  // Calculate total
  result.total = result.commands.length +
                 result.conditionals.length +
                 result.procedures.length +
                 result.guidelines.length;

  return result;
}

/**
 * Checks if text matches exclusion patterns
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if should be excluded
 */
function isExcluded(text) {
  for (const pattern of Object.values(EXCLUSIONS)) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if word is an action verb
 *
 * @param {string} word - Word to check
 * @returns {boolean} True if action verb
 */
function isActionVerb(word) {
  const actionVerbs = [
    'Analyze', 'Create', 'Update', 'Customize', 'Install',
    'Run', 'Check', 'Verify', 'Validate', 'Test',
    'Build', 'Deploy', 'Configure', 'Setup', 'Initialize',
    'Review', 'Document', 'Implement', 'Refactor', 'Fix'
  ];
  return actionVerbs.includes(word);
}
