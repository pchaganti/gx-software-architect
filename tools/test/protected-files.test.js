import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isProtected, protectedFileMessage } from '../lib/protected-files.js';

describe('Protected files', () => {
  describe('isProtected', () => {
    it('flags .architecture/members.yml', () => {
      assert.strictEqual(isProtected('.architecture/members.yml'), true);
      assert.strictEqual(isProtected('/abs/path/.architecture/members.yml'), true);
    });

    it('flags .architecture/principles.md', () => {
      assert.strictEqual(isProtected('.architecture/principles.md'), true);
    });

    it('flags .architecture/config.yml', () => {
      assert.strictEqual(isProtected('.architecture/config.yml'), true);
    });

    it('does not flag unrelated files', () => {
      for (const p of [
        'README.md',
        'package.json',
        '.architecture/decisions/adrs/ADR-001-foo.md',
        '.architecture/templates/adr-template.md',
        'tools/cli.js',
        '.claude/settings.json',
      ]) {
        assert.strictEqual(isProtected(p), false, `should not flag ${p}`);
      }
    });

    it('does not flag a file that merely contains a protected name as substring', () => {
      assert.strictEqual(isProtected('.architecture/members.yml.bak'), false);
      assert.strictEqual(isProtected('docs/principles.md'), false);
      assert.strictEqual(isProtected('config.yml'), false);
    });

    it('handles empty or undefined paths defensively', () => {
      assert.strictEqual(isProtected(''), false);
      assert.strictEqual(isProtected(undefined), false);
      assert.strictEqual(isProtected(null), false);
    });
  });

  describe('protectedFileMessage', () => {
    it('returns a message that names the file', () => {
      const msg = protectedFileMessage('.architecture/members.yml');
      assert.match(msg, /members\.yml/);
    });

    it('explains why the file is protected', () => {
      const msg = protectedFileMessage('.architecture/members.yml');
      assert.match(msg, /generator|generate-subagents|drift/i);
    });

    it('directs the user to the canonical edit workflow for members.yml', () => {
      const msg = protectedFileMessage('.architecture/members.yml');
      assert.match(msg, /generate-subagents|regenerate/i);
    });

    it('explains principles.md and config.yml separately', () => {
      const principles = protectedFileMessage('.architecture/principles.md');
      const config = protectedFileMessage('.architecture/config.yml');
      assert.match(principles, /principle/i);
      assert.match(config, /config|operational/i);
    });

    it('mentions the override pathway (env var or pragmatic-guard skill)', () => {
      const msg = protectedFileMessage('.architecture/principles.md');
      assert.match(msg, /CLAUDE_ALLOW_PROTECTED|override/i);
    });
  });
});
