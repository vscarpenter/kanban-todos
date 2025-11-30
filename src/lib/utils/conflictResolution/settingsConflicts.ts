/**
 * Settings conflict resolution logic
 */

import { Settings } from '@/lib/types';
import type { ConflictResolutionOptions, ResolutionAction } from './types';
import { mergeSettings } from './merging';

/**
 * Resolves settings conflicts based on the specified strategy
 */
export function resolveSettingsConflicts(
  importedSettings: Settings | undefined,
  existingSettings: Settings | undefined,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Settings | undefined {
  if (!importedSettings) {
    return existingSettings;
  }

  if (!existingSettings) {
    return importedSettings;
  }

  switch (options.settingsStrategy) {
    case 'skip':
      resolutionLog.push({
        type: 'skip',
        itemType: 'settings',
        itemId: 'settings',
        reason: 'Kept existing settings'
      });
      return existingSettings;

    case 'overwrite':
      resolutionLog.push({
        type: 'overwrite',
        itemType: 'settings',
        itemId: 'settings',
        reason: 'Overwrote with imported settings'
      });
      return importedSettings;

    case 'merge':
      const mergeResult = mergeSettings(existingSettings, importedSettings, options.mergeStrategy);
      resolutionLog.push({
        type: 'merge',
        itemType: 'settings',
        itemId: 'settings',
        mergedFields: mergeResult.mergedFields,
        reason: 'Merged settings'
      });
      return mergeResult.merged;

    default:
      return existingSettings;
  }
}
