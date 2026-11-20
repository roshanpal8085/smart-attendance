import {Platform, PermissionsAndroid} from 'react-native';
import {
  BleManager,
  State as BleState,
  ScanMode,
  Subscription,
} from 'react-native-ble-plx';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import type {BluetoothState, ScannedBeacon, TeacherSessionAdvertisement} from '../types/ble';
import {BLE_MIN_RSSI} from '../utils/constants';

class BleService {
  private manager: BleManager | null = null;
  private stateSubscription: Subscription | null = null;
  private isScanning = false;

  constructor() {
    this.initManager();
  }

  private initManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }
    return this.manager;
  }

  /**
   * Request all necessary Bluetooth and Location runtime permissions
   * depending on the OS and API level.
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version as number;

        if (apiLevel >= 31) {
          // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
          const scanStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
          const connectStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);

          const scanGranted = scanStatus === RESULTS.GRANTED;
          const connectGranted = connectStatus === RESULTS.GRANTED;

          return scanGranted && connectGranted;
        } else {
          // Android <= 30 requires Location permission for BLE scanning
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission for Bluetooth Beacon Discovery',
              message:
                'Smart Attendance requires location access to discover nearby classroom beacons.',
              buttonNeutral: 'Ask Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } else if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
        if (status === RESULTS.DENIED) {
          const req = await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
          return req === RESULTS.GRANTED;
        }
        return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
      }
      return true;
    } catch (error) {
      console.warn('[BleService] Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Checks current device Bluetooth power and readiness state.
   */
  public async checkBluetoothState(): Promise<BluetoothState> {
    try {
      const manager = this.initManager();
      const state = await manager.state();

      switch (state) {
        case BleState.PoweredOn:
          return 'on';
        case BleState.PoweredOff:
          return 'off';
        case BleState.Unsupported:
          return 'unsupported';
        case BleState.Unauthorized:
          return 'unauthorized';
        case BleState.Resetting:
          return 'resetting';
        default:
          return 'unknown';
      }
    } catch (error) {
      console.warn('[BleService] checkBluetoothState error:', error);
      return 'unknown';
    }
  }

  /**
   * Subscribes to Bluetooth hardware state changes (on/off/unauthorized)
   */
  public onStateChange(listener: (state: BluetoothState) => void): () => void {
    const manager = this.initManager();
    this.stateSubscription?.remove();

    this.stateSubscription = manager.onStateChange((state) => {
      let mappedState: BluetoothState = 'unknown';
      if (state === BleState.PoweredOn) mappedState = 'on';
      else if (state === BleState.PoweredOff) mappedState = 'off';
      else if (state === BleState.Unsupported) mappedState = 'unsupported';
      else if (state === BleState.Unauthorized) mappedState = 'unauthorized';
      listener(mappedState);
    }, true);

    return () => {
      this.stateSubscription?.remove();
      this.stateSubscription = null;
    };
  }

  /**
   * Scans for fixed classroom beacons matching classroomBeaconUUID.
   */
  public async scanForClassroomBeacon(
    classroomBeaconUUID: string,
    onDetected: (rssi: number, txPower?: number) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        throw new Error('Bluetooth scan permissions not granted');
      }

      const btState = await this.checkBluetoothState();
      if (btState !== 'on') {
        throw new Error(`Bluetooth is currently ${btState}`);
      }

      await this.stopScan();
      const manager = this.initManager();
      this.isScanning = true;

      const targetUuidLower = classroomBeaconUUID.toLowerCase();

      manager.startDeviceScan(
        null,
        {
          scanMode: ScanMode.LowLatency,
          allowDuplicates: true,
        },
        (error, device) => {
          if (error) {
            this.isScanning = false;
            onError?.(error);
            return;
          }

          if (!device || device.rssi === null || device.rssi < BLE_MIN_RSSI) {
            return;
          }

          // Check device service UUIDs or device ID matching target beacon
          const matchesId =
            device.id?.toLowerCase() === targetUuidLower ||
            (device.serviceUUIDs &&
              device.serviceUUIDs.some(
                (uuid) => uuid.toLowerCase() === targetUuidLower,
              ));

          // Also match manufacturer or local name if beacon carries UUID in name
          const matchesName =
            device.name?.toLowerCase().includes(targetUuidLower) ||
            device.localName?.toLowerCase().includes(targetUuidLower);

          if (matchesId || matchesName) {
            onDetected(device.rssi, device.txPowerLevel ?? undefined);
          }
        },
      );
    } catch (error: any) {
      this.isScanning = false;
      onError?.(error);
    }
  }

  /**
   * Scans for teacher phone session broadcast containing session challenge token.
   */
  public async scanForTeacherSession(
    sessionChallenge: string,
    onDetected: (rssi: number) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        throw new Error('Bluetooth scan permissions not granted');
      }

      const btState = await this.checkBluetoothState();
      if (btState !== 'on') {
        throw new Error(`Bluetooth is currently ${btState}`);
      }

      await this.stopScan();
      const manager = this.initManager();
      this.isScanning = true;

      const challengeLower = sessionChallenge.toLowerCase();

      manager.startDeviceScan(
        null,
        {
          scanMode: ScanMode.LowLatency,
          allowDuplicates: true,
        },
        (error, device) => {
          if (error) {
            this.isScanning = false;
            onError?.(error);
            return;
          }

          if (!device || device.rssi === null || device.rssi < BLE_MIN_RSSI) {
            return;
          }

          // Check if manufacturerData or device name contains session challenge
          const rawData = device.manufacturerData || '';
          const devName = (device.name || device.localName || '').toLowerCase();

          const challengeMatches =
            rawData.toLowerCase().includes(challengeLower) ||
            devName.includes(challengeLower) ||
            (device.serviceUUIDs &&
              device.serviceUUIDs.some((uuid) =>
                uuid.toLowerCase().includes(challengeLower.slice(0, 8)),
              ));

          if (challengeMatches) {
            onDetected(device.rssi);
          }
        },
      );
    } catch (error: any) {
      this.isScanning = false;
      onError?.(error);
    }
  }

  /**
   * Stops ongoing BLE scan
   */
  public async stopScan(): Promise<void> {
    if (this.manager && this.isScanning) {
      try {
        await this.manager.stopDeviceScan();
      } catch (err) {
        console.warn('[BleService] Error stopping scan:', err);
      } finally {
        this.isScanning = false;
      }
    }
  }

  /**
   * Tears down manager subscriptions
   */
  public destroy(): void {
    this.stopScan();
    this.stateSubscription?.remove();
    this.stateSubscription = null;
    this.manager?.destroy();
    this.manager = null;
  }
}

export const bleService = new BleService();
