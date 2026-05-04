const FILENAME_PATTERN = /^ADR-\d{3}-[a-z0-9-]+\.md$/;
const EXAMPLE_PREFIX = 'example-';
const REQUIRED_SECTIONS = ['Status', 'Context', 'Decision', 'Consequences'];
const VALID_STATUSES = ['Draft', 'Proposed', 'Accepted', 'Implemented', 'Deprecated', 'Superseded'];

export function validateAdr(filename, content) {
  const errors = [];

  if (!filename.startsWith(EXAMPLE_PREFIX) && !FILENAME_PATTERN.test(filename)) {
    errors.push(
      `Invalid filename "${filename}". Expected ADR-XXX-kebab-case-title.md (three digits, lowercase slug).`
    );
  }

  if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
    errors.push('ADRs must not contain YAML frontmatter; the document opens with the H1 title.');
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!hasSection(content, section)) {
      errors.push(`Missing required section: "## ${section}".`);
    }
  }

  if (hasSection(content, 'Status')) {
    const status = extractStatus(content);
    if (status === null) {
      errors.push(
        `Status section is empty. Expected one of: ${VALID_STATUSES.join(', ')}.`
      );
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push(
        `Invalid Status "${status}". Expected one of: ${VALID_STATUSES.join(', ')}.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function hasSection(content, name) {
  const heading = new RegExp(`^##\\s+${escapeRegExp(name)}\\s*$`, 'm');
  return heading.test(content);
}

function extractStatus(content) {
  const match = content.match(/^##\s+Status\s*$([\s\S]*?)(?=^##\s+|\Z)/m);
  if (!match) return null;
  const body = match[1];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/[.,;:!?]+$/, '');
    if (!line) continue;
    if (line.startsWith('[') && line.endsWith(']')) continue;
    return line.split(/\s+/)[0];
  }
  return null;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
