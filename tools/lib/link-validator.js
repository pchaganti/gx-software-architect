/**
 * Link Validator - Validates internal markdown links
 *
 * Extracts and validates markdown links in documentation files,
 * ignoring external URLs and anchor-only links.
 */

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
