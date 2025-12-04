import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateLinks } from '../lib/link-validator.js';

describe('Link Validator', () => {
  describe('validateLinks', () => {
    it('returns empty array when no markdown links found', () => {
      const content = 'This is plain text without links.';
      const result = validateLinks(content, '/test.md');

      assert.strictEqual(result.length, 0);
    });

    it('extracts markdown links from content', () => {
      const content = 'Check [this](./file.md) and [that](../other.md)';
      const result = validateLinks(content, '/test.md');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].target, './file.md');
      assert.strictEqual(result[1].target, '../other.md');
    });

    it('ignores external HTTP links', () => {
      const content = 'See [docs](https://example.com) for details';
      const result = validateLinks(content, '/test.md');

      assert.strictEqual(result.length, 0);
    });

    it('ignores anchor-only links', () => {
      const content = 'Jump to [section](#heading)';
      const result = validateLinks(content, '/test.md');

      assert.strictEqual(result.length, 0);
    });

    it('includes line numbers for each link', () => {
      const content = 'Line 1\nCheck [link](./file.md) here\nLine 3';
      const result = validateLinks(content, '/test.md');

      assert.strictEqual(result[0].line, 2);
    });
  });
});
