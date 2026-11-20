import BLEAdvertiser from 'react-native-ble-advertiser';
import {Platform} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// Company ID for custom manufacturer payload (e.g. 0x00E0 for Google or 0xFFFF for test)
const COMPANY_ID = 0x00e0;

class AdvertiserService {
  private _isAdvertising = false;
  private currentSessionId: string | null = null;

  public get isAdvertising(): boolean {
    return this._isAdvertising;
  }

  public get activeSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Request Bluetooth advertising permissions on Android 12+ (BLUETOOTH_ADVERTISE)
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 31) {
        const result = await request(PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE);
        return result === RESULTS.GRANTED;
      }
    }
    return true;
  }

  /**
   * Starts BLE peripheral advertising for a teacher's active attendance session.
   * Broadcasts manufacturer data containing session challenge.
   */
  public async startAdvertising(
    sessionId: string,
    sessionChallenge: string,
  ): Promise<boolean> {
    try {
      const permitted = await this.requestPermissions();
      if (!permitted) {
        throw new Error('Bluetooth advertising permission denied');
      }

      // If already advertising a different session, stop it first
      if (this._isAdvertising) {
        await this.stopAdvertising();
      }

      BLEAdvertiser.setCompanyId(COMPANY_ID);

      // Encode first 8 chars of session ID and challenge bytes into manufacturer payload
      const payloadString = `${sessionId.slice(0, 8)}:${sessionChallenge.slice(0, 8)}`;
      const payloadBytes: number[] = [];
      for (let i = 0; i < payloadString.length; i++) {
        payloadBytes.push(payloadString.charCodeAt(i));
      }

      // Format UUID for session broadcast
      const serviceUuid = this.formatSessionUuid(sessionId);

      await BLEAdvertiser.broadcast(serviceUuid, payloadBytes, {
        advertiseMode: BLEAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,
        includeDeviceName: false,
        includeTxPowerLevel: true,
      });

      this._isAdvertising = true;
      this.currentSessionId = sessionId;
      return true;
    } catch (error) {
      console.error('[AdvertiserService] Failed to start advertising:', error);
      this._isAdvertising = false;
      this.currentSessionId = null;
      throw error;
    }
  }

  /**
   * Stops BLE peripheral advertising.
   */
  public async stopAdvertising(): Promise<boolean> {
    try {
      if (this._isAdvertising) {
        await BLEAdvertiser.stopBroadcast();
      }
      this._isAdvertising = false;
      this.currentSessionId = null;
      return true;
    } catch (error) {
      console.warn('[AdvertiserService] Failed to stop advertising:', error);
      this._isAdvertising = false;
      this.currentSessionId = null;
      return false;
    }
  }

  /**
   * Helper to format an arbitrary session ID into a valid 128-bit UUID format
   */
  private formatSessionUuid(sessionId: string): string {
    const clean = sessionId.replace(/-/g, '').padEnd(32, '0').slice(0, 32);
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
  }
}

export const advertiserService = new AdvertiserService();
