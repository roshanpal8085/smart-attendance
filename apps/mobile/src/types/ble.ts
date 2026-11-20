export type BluetoothState =
  | 'on'
  | 'off'
  | 'unsupported'
  | 'unauthorized'
  | 'resetting'
  | 'unknown'
  | 'checking';

export type ProximityState =
  | 'searching'
  | 'detected'
  | 'verifying'
  | 'eligible'
  | 'not_eligible'
  | 'signal_lost'
  | 'disabled'
  | 'permission_required'
  | 'unsupported';

export interface ScannedBeacon {
  uuid: string;
  major?: number;
  minor?: number;
  rssi: number;
  txPower?: number;
  lastSeen: number;
}

export interface TeacherSessionAdvertisement {
  sessionId: string;
  challenge: string;
  rssi: number;
  lastSeen: number;
}

export interface BLEScanCallbacks {
  onClassroomDetected?: (beacon: ScannedBeacon) => void;
  onTeacherSessionDetected?: (session: TeacherSessionAdvertisement) => void;
  onError?: (error: Error) => void;
}
