import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  discoverSource,
  PLUGIN_NAME,
  SENTINEL_PATH,
} from '../lib/setup-source-discovery.js';

function makeExists(paths) {
  const set = new Set(paths);
  return p => set.has(p);
}

function noPluginCandidates() {
  return [];
}

describe('Setup Source Discovery', () => {
  describe('exports', () => {
    it('exposes the framework name', () => {
      assert.strictEqual(PLUGIN_NAME, 'ai-software-architect');
    });

    it('exposes the sentinel path used to identify a framework root', () => {
      assert.strictEqual(SENTINEL_PATH, '.architecture/templates/adr-template.md');
    });
  });

  describe('discoverSource', () => {
    it('prefers env var when CLAUDE_PLUGIN_ROOT contains the sentinel', () => {
      const result = discoverSource({
        envRoot: '/plugin/root',
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists(['/plugin/root/.architecture/templates/adr-template.md']),
        listPluginCandidates: noPluginCandidates,
      });
      assert.deepStrictEqual(result, {
        found: true,
        path: '/plugin/root',
        source: 'env',
      });
    });

    it('skips env var when set but the sentinel is missing at that path', () => {
      const result = discoverSource({
        envRoot: '/wrong/path',
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([]),
        listPluginCandidates: noPluginCandidates,
      });
      assert.strictEqual(result.found, false);
    });

    it('falls back to plugin candidates when env var is unset', () => {
      const candidate =
        '/home/.claude/plugins/marketplaces/c-asa/plugins/ai-software-architect';
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([`${candidate}/.architecture/templates/adr-template.md`]),
        listPluginCandidates: () => [candidate],
      });
      assert.deepStrictEqual(result, {
        found: true,
        path: candidate,
        source: 'plugin',
      });
    });

    it('returns the first candidate that contains the sentinel, in order', () => {
      const a =
        '/home/.claude/plugins/marketplaces/old/plugins/ai-software-architect';
      const b =
        '/home/.claude/plugins/marketplaces/new/plugins/ai-software-architect';
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([`${b}/.architecture/templates/adr-template.md`]),
        listPluginCandidates: () => [a, b],
      });
      assert.strictEqual(result.path, b);
      assert.strictEqual(result.source, 'plugin');
    });

    it('falls back to legacy clone when no plugin candidate matches', () => {
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([
          '.architecture/.architecture/.architecture/templates/adr-template.md',
        ]),
        listPluginCandidates: noPluginCandidates,
      });
      assert.deepStrictEqual(result, {
        found: true,
        path: '.architecture/.architecture',
        source: 'clone',
      });
    });

    it('prefers plugin path when both plugin and legacy clone are present', () => {
      const candidate =
        '/home/.claude/plugins/marketplaces/c-asa/plugins/ai-software-architect';
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([
          `${candidate}/.architecture/templates/adr-template.md`,
          '.architecture/.architecture/.architecture/templates/adr-template.md',
        ]),
        listPluginCandidates: () => [candidate],
      });
      assert.strictEqual(result.source, 'plugin');
    });

    it('returns found:false when no source is available', () => {
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([]),
        listPluginCandidates: noPluginCandidates,
      });
      assert.deepStrictEqual(result, { found: false });
    });

    it('treats empty-string envRoot as unset', () => {
      const result = discoverSource({
        envRoot: '',
        pluginsDir: '/home/.claude/plugins',
        legacyClone: '.architecture/.architecture',
        exists: makeExists([]),
        listPluginCandidates: noPluginCandidates,
      });
      assert.strictEqual(result.found, false);
    });

    it('treats undefined pluginsDir as no plugin lookup', () => {
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: undefined,
        legacyClone: '.architecture/.architecture',
        exists: makeExists([
          '.architecture/.architecture/.architecture/templates/adr-template.md',
        ]),
        listPluginCandidates: () => {
          throw new Error('should not be called when pluginsDir is undefined');
        },
      });
      assert.strictEqual(result.source, 'clone');
    });

    it('treats undefined legacyClone as no legacy fallback', () => {
      const result = discoverSource({
        envRoot: undefined,
        pluginsDir: '/home/.claude/plugins',
        legacyClone: undefined,
        exists: makeExists([
          '.architecture/.architecture/.architecture/templates/adr-template.md',
        ]),
        listPluginCandidates: noPluginCandidates,
      });
      assert.strictEqual(result.found, false);
    });
  });
});
