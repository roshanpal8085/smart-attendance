import {useState, useCallback, useEffect} from 'react';
import {advertiserService} from '../services/advertiserService';
import {useSessionStore} from '../store/sessionStore';

export function useBLEAdvertising() {
  const [error, setError] = useState<string | null>(null);
  const {isAdvertising, setAdvertising} = useSessionStore();

  const startAdvertising = useCallback(
    async (sessionId: string, sessionChallenge: string) => {
      try {
        setError(null);
        await advertiserService.startAdvertising(sessionId, sessionChallenge);
        setAdvertising(true);
      } catch (err: any) {
        const msg = err?.message || 'Failed to start Bluetooth advertising';
        setError(msg);
        setAdvertising(false);
        throw err;
      }
    },
    [setAdvertising],
  );

  const stopAdvertising = useCallback(async () => {
    try {
      await advertiserService.stopAdvertising();
    } catch (err: any) {
      console.warn('[useBLEAdvertising] Error stopping advertising:', err);
    } finally {
      setAdvertising(false);
    }
  }, [setAdvertising]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      advertiserService.stopAdvertising();
    };
  }, []);

  return {
    isAdvertising,
    startAdvertising,
    stopAdvertising,
    error,
  };
}
