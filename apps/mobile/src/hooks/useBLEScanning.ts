import {useState, useEffect, useCallback, useRef} from 'react';
import {bleService} from '../services/bleService';
import {studentApi} from '../services/studentApi';
import type {BluetoothState, ProximityState} from '../types/ble';
import {
  PRESENCE_CHECK_INTERVAL_MS,
  PRESENCE_REQUIRED_SECONDS,
  BLE_MIN_RSSI,
} from '../utils/constants';

interface UseBLEScanningOptions {
  classroomBeaconUuid?: string;
  sessionChallenge?: string;
  sessionId?: string;
  enabled?: boolean;
  requiredSeconds?: number;
}

export function useBLEScanning({
  classroomBeaconUuid,
  sessionChallenge,
  sessionId,
  enabled = true,
  requiredSeconds = PRESENCE_REQUIRED_SECONDS,
}: UseBLEScanningOptions = {}) {
  const [bleState, setBleState] = useState<BluetoothState>('checking');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [proximityState, setProximityState] = useState<ProximityState>('searching');
  const [signalStrength, setSignalStrength] = useState<number | null>(null);
  const [presenceWindowSeconds, setPresenceWindowSeconds] = useState(0);

  const lastSeenRef = useRef<number | null>(null);
  const currentRssiRef = useRef<number | null>(null);
  const evidenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presenceTickerRef = useRef<NodeJS.Timeout | null>(null);
  const signalWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Permission & State Check
  const checkPermissionsAndState = useCallback(async () => {
    setBleState('checking');
    const granted = await bleService.requestPermissions();
    setPermissionGranted(granted);

    if (!granted) {
      setProximityState('permission_required');
      return;
    }

    const state = await bleService.checkBluetoothState();
    setBleState(state);

    if (state === 'off') {
      setProximityState('disabled');
    } else if (state === 'unsupported') {
      setProximityState('unsupported');
    } else if (state === 'on') {
      setProximityState('searching');
    }
  }, []);

  // 2. Submit Presence Evidence to Server
  const submitEvidenceToServer = useCallback(async () => {
    if (!currentRssiRef.current || !enabled) return;

    try {
      const result = await studentApi.submitPresenceEvidence({
        session_id: sessionId,
        classroom_beacon_uuid: classroomBeaconUuid,
        session_challenge: sessionChallenge,
        rssi: currentRssiRef.current,
        timestamp: new Date().toISOString(),
      });

      if (result) {
        setPresenceWindowSeconds(result.window_seconds);
        if (result.is_eligible || result.window_seconds >= requiredSeconds) {
          setProximityState('eligible');
        } else {
          setProximityState('verifying');
        }
      }
    } catch (err) {
      console.warn('[useBLEScanning] Failed to submit presence evidence:', err);
    }
  }, [sessionId, classroomBeaconUuid, sessionChallenge, enabled, requiredSeconds]);

  // 3. Handle Beacon Detection Event
  const handleBeaconDetected = useCallback(
    (rssi: number, txPower?: number) => {
      lastSeenRef.current = Date.now();
      currentRssiRef.current = rssi;
      setSignalStrength(rssi);

      setProximityState((prev) => {
        if (prev === 'disabled' || prev === 'permission_required' || prev === 'unsupported') {
          return prev;
        }
        if (presenceWindowSeconds >= requiredSeconds) {
          return 'eligible';
        }
        if (prev === 'searching' || prev === 'signal_lost') {
          return 'detected';
        }
        return prev;
      });
    },
    [presenceWindowSeconds, requiredSeconds],
  );

  // 4. Setup Bluetooth State Listener
  useEffect(() => {
    checkPermissionsAndState();

    const unsubscribe = bleService.onStateChange((state) => {
      setBleState(state);
      if (state === 'off') {
        setProximityState('disabled');
        setSignalStrength(null);
      } else if (state === 'unsupported') {
        setProximityState('unsupported');
      } else if (state === 'on') {
        setProximityState('searching');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [checkPermissionsAndState]);

  // 5. Start / Stop Scanning Loop
  useEffect(() => {
    if (!enabled || bleState !== 'on' || !permissionGranted) {
      bleService.stopScan();
      return;
    }

    const startScanning = async () => {
      try {
        if (sessionChallenge) {
          await bleService.scanForTeacherSession(
            sessionChallenge,
            (rssi) => handleBeaconDetected(rssi),
            (err) => console.warn('[useBLEScanning] Teacher session scan error:', err),
          );
        } else if (classroomBeaconUuid) {
          await bleService.scanForClassroomBeacon(
            classroomBeaconUuid,
            (rssi, txPower) => handleBeaconDetected(rssi, txPower),
            (err) => console.warn('[useBLEScanning] Classroom scan error:', err),
          );
        } else {
          // If no specific UUID, scan generally for presence
          await bleService.scanForClassroomBeacon(
            '',
            (rssi, txPower) => handleBeaconDetected(rssi, txPower),
            (err) => console.warn('[useBLEScanning] General scan error:', err),
          );
        }
      } catch (err) {
        console.warn('[useBLEScanning] Start scan error:', err);
      }
    };

    startScanning();

    return () => {
      bleService.stopScan();
    };
  }, [
    enabled,
    bleState,
    permissionGranted,
    classroomBeaconUuid,
    sessionChallenge,
    handleBeaconDetected,
  ]);

  // 6. Evidence Submission Interval (Every 30 seconds)
  useEffect(() => {
    if (!enabled) return;

    evidenceTimerRef.current = setInterval(() => {
      submitEvidenceToServer();
    }, PRESENCE_CHECK_INTERVAL_MS);

    return () => {
      if (evidenceTimerRef.current) {
        clearInterval(evidenceTimerRef.current);
      }
    };
  }, [enabled, submitEvidenceToServer]);

  // 7. Signal Watchdog (detects signal loss after 15 seconds of no packets)
  useEffect(() => {
    if (!enabled) return;

    signalWatchdogRef.current = setInterval(() => {
      if (
        lastSeenRef.current &&
        Date.now() - lastSeenRef.current > 15_000 &&
        bleState === 'on'
      ) {
        setSignalStrength(null);
        setProximityState((prev) => {
          if (prev === 'disabled' || prev === 'permission_required') return prev;
          return 'signal_lost';
        });
      }
    }, 5_000);

    return () => {
      if (signalWatchdogRef.current) {
        clearInterval(signalWatchdogRef.current);
      }
    };
  }, [enabled, bleState]);

  // 8. Local presence window ticker (for smooth UI display)
  useEffect(() => {
    if (!enabled) return;

    presenceTickerRef.current = setInterval(() => {
      const isDetectedRecently =
        lastSeenRef.current && Date.now() - lastSeenRef.current < 15_000;

      if (isDetectedRecently) {
        setPresenceWindowSeconds((prev) => {
          const next = prev + 1;
          if (next >= requiredSeconds) {
            setProximityState('eligible');
          } else {
            setProximityState('verifying');
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      if (presenceTickerRef.current) {
        clearInterval(presenceTickerRef.current);
      }
    };
  }, [enabled, requiredSeconds]);

  return {
    bleState,
    permissionGranted,
    proximityState,
    signalStrength,
    presenceWindowSeconds,
    requestPermissions: checkPermissionsAndState,
  };
}
