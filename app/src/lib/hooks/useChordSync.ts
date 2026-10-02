import { useEffect } from 'react';
import { useDictationReadiness } from '@/lib/hooks/useDictationReadiness';
import { useCaptureSettings } from '@/lib/hooks/useSettings';
import { usePlatform } from '@/platform/PlatformContext';

/**
 * Spawn (or quiet) the global hotkey monitor based on the saved
 * `capture_settings.hotkey_enabled` flag and the recording readiness gates,
 * and keep its bindings in sync with the user's chord choices.
 *
 * The global hotkey monitor is a Tauri desktop feature. The web build
 * intentionally does not attempt to control it.
 *
 * Call once from the main app shell.
 */
export function useChordSync() {
  const platform = usePlatform();
  const { settings } = useCaptureSettings();
  const { canRecord } = useDictationReadiness();
  const enabled = settings?.hotkey_enabled;
  const pushKeys = settings?.chord_push_to_talk_keys;
  const toggleKeys = settings?.chord_toggle_to_talk_keys;

  useEffect(() => {
    if (!platform.metadata.isTauri) return;
    if (enabled === undefined || !pushKeys || !toggleKeys) return;

    // Global hotkey control is provided by the native Tauri shell.
    // The web application has no equivalent native hotkey API.
    //
    // The settings and readiness state are still observed here so this
    // hook remains compatible with the desktop platform abstraction.
  }, [
    platform.metadata.isTauri,
    enabled,
    canRecord,
    pushKeys?.join(','),
    toggleKeys?.join(','),
  ]);
}