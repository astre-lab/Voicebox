import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/platform/PlatformContext';

/**
 * Tracks macOS Input Monitoring permission state.
 *
 * Input Monitoring is a native Tauri/macOS feature. The browser build does
 * not have access to macOS System Settings or the native permission APIs, so
 * this hook is intentionally a no-op on the web.
 */
export function useInputMonitoringPermission() {
  const platform = usePlatform();
  const [needsPermission, setNeedsPermission] = useState(false);
  const [checking, setChecking] = useState(false);

  const recheck = useCallback(async (): Promise<boolean> => {
    if (!platform.metadata.isTauri) {
      setNeedsPermission(false);
      return true;
    }

    // Native permission checking is handled by the Tauri desktop shell.
    // This branch remains only for compatibility with the desktop build.
    setChecking(false);
    return true;
  }, [platform.metadata.isTauri]);

  useEffect(() => {
    if (!platform.metadata.isTauri) {
      setNeedsPermission(false);
      setChecking(false);
      return;
    }

    recheck();

    const onFocus = () => {
      recheck();
    };

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [platform.metadata.isTauri, recheck]);

  const openSettings = useCallback(async () => {
    if (!platform.metadata.isTauri) {
      return;
    }

    // Native macOS settings navigation is provided by the Tauri desktop
    // shell. The web build intentionally does nothing here.
  }, [platform.metadata.isTauri]);

  return {
    needsPermission,
    checking,
    recheck,
    openSettings,
  };
}

/**
 * Inline notice rendered under the global-shortcut toggle when the user has
 * opted in but macOS Input Monitoring is not granted.
 *
 * The notice never appears in the browser build because browser applications
 * do not have macOS Input Monitoring permission requirements.
 */
export function InputMonitoringNotice({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const {
    needsPermission,
    checking,
    recheck,
    openSettings,
  } = useInputMonitoringPermission();

  const [stillMissing, setStillMissing] = useState(false);

  const handleRecheck = useCallback(async () => {
    setStillMissing(false);

    const trusted = await recheck();

    if (!trusted) {
      setStillMissing(true);
    }
  }, [recheck]);

  if (!enabled || !needsPermission) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t('captures.permissions.inputMonitoring.title')}
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed">
            <Trans
              i18nKey="captures.permissions.inputMonitoring.body"
              components={{ path: <span /> }}
            />
          </p>

          <div className="flex items-center gap-2 pt-1.5">
            <Button
              size="sm"
              onClick={openSettings}
              className="gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('captures.permissions.inputMonitoring.openSettings')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRecheck}
              disabled={checking}
            >
              {checking
                ? t('captures.permissions.inputMonitoring.rechecking')
                : t('captures.permissions.inputMonitoring.recheck')}
            </Button>
          </div>

          {stillMissing && !checking && (
            <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
              {t('captures.permissions.inputMonitoring.stillMissing')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}