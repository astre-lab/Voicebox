import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAutoUpdater } from '@/hooks/useAutoUpdater';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useChordSync } from '@/lib/hooks/useChordSync';
import { usePlatform } from '@/platform/PlatformContext';
import { router } from '@/router';
import { useLogStore } from '@/stores/logStore';
import { getDefaultServerUrl, isLoopbackVoiceboxServerUrl, useServerStore } from '@/stores/serverStore';

function App() {
  useThemeSync();

  return <MainApp />;
}

function MainApp() {
  const platform = usePlatform();

  // Web builds connect to an externally running Voicebox server.
  // The server URL can be supplied through VITE_SERVER_URL.
  useEffect(() => {
    const serverUrl = getDefaultServerUrl();
    const currentServerUrl = useServerStore.getState().serverUrl;

    if (currentServerUrl !== serverUrl && isLoopbackVoiceboxServerUrl(currentServerUrl)) {
      useServerStore.getState().setServerUrl(serverUrl);
    }
  }, []);

  // Auto-updater and global hotkey synchronization are no-ops on the web
  // platform, while retaining compatibility with the shared application code.
  useAutoUpdater({ checkOnMount: true, showToast: true });
  useChordSync();

  // Subscribe to server logs supplied by the active platform.
  useEffect(() => {
    const unsubscribe = platform.lifecycle.subscribeToServerLogs((entry) => {
      useLogStore.getState().addEntry(entry);
    });

    return unsubscribe;
  }, [platform.lifecycle]);

  return <RouterProvider router={router} />;
}

export default App;
