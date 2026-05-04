import { sep } from 'node:path';

const PROTECTED_FILES = {
  'members.yml': {
    parent: `.architecture${sep}`,
    reason:
      'members.yml is the source of truth for the generated agents/*.md subagents. Editing it without regenerating causes the committed subagents to drift.',
    workflow:
      'Edit members.yml directly in your editor (outside Claude Code), then run `node tools/cli.js generate-subagents` to update agents/*.md.',
  },
  'principles.md': {
    parent: `.architecture${sep}`,
    reason:
      'principles.md encodes the architecture team\'s foundational principles. Changes here ripple through every review and ADR.',
    workflow:
      'Make principle changes through an ADR (use the create-adr skill) so the rationale is recorded.',
  },
  'config.yml': {
    parent: `.architecture${sep}`,
    reason:
      'config.yml controls operational mode (pragmatic_mode, review_process, ADR rules). Silent edits change framework behavior.',
    workflow:
      'Use the pragmatic-guard skill to toggle pragmatic mode, or update via an ADR for structural config changes.',
  },
};

export function isProtected(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) return false;
  for (const [name, { parent }] of Object.entries(PROTECTED_FILES)) {
    if (filePath.endsWith(`${parent}${name}`)) return true;
  }
  return false;
}

export function protectedFileMessage(filePath) {
  if (typeof filePath !== 'string') return '';
  for (const [name, { reason, workflow }] of Object.entries(PROTECTED_FILES)) {
    if (filePath.endsWith(`${PROTECTED_FILES[name].parent}${name}`)) {
      return [
        `Refusing to edit protected file: ${filePath}`,
        '',
        `Why: ${reason}`,
        '',
        `Recommended workflow: ${workflow}`,
        '',
        'To override for an intentional, one-off edit, set CLAUDE_ALLOW_PROTECTED=1 in the environment and retry.',
      ].join('\n');
    }
  }
  return '';
}
