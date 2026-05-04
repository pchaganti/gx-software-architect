import { join } from 'node:path';

export const PLUGIN_NAME = 'ai-software-architect';
export const SENTINEL_PATH = '.architecture/templates/adr-template.md';

export function discoverSource({
  envRoot,
  pluginsDir,
  legacyClone,
  exists,
  listPluginCandidates,
}) {
  if (envRoot && exists(join(envRoot, SENTINEL_PATH))) {
    return { found: true, path: envRoot, source: 'env' };
  }

  if (pluginsDir) {
    for (const candidate of listPluginCandidates(pluginsDir)) {
      if (exists(join(candidate, SENTINEL_PATH))) {
        return { found: true, path: candidate, source: 'plugin' };
      }
    }
  }

  if (legacyClone && exists(join(legacyClone, SENTINEL_PATH))) {
    return { found: true, path: legacyClone, source: 'clone' };
  }

  return { found: false };
}
