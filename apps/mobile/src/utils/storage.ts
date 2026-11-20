import * as Keychain from 'react-native-keychain';
import {MMKV} from 'react-native-mmkv';
import {KEYCHAIN_SERVICE} from './constants';

export const mmkv = new MMKV({
  id: 'smart-attendance-mmkv',
});

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Securely stores access and refresh tokens in the device's hardware-backed
 * keystore / keychain using react-native-keychain.
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<boolean> {
  try {
    const payload = JSON.stringify({accessToken, refreshToken});
    const result = await Keychain.setGenericPassword(
      'tokens',
      payload,
      {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      },
    );
    return Boolean(result);
  } catch (error) {
    console.error('Failed to save tokens in Keychain:', error);
    return false;
  }
}

/**
 * Retrieves access and refresh tokens from Keychain.
 */
export async function getTokens(): Promise<StoredTokens | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    if (credentials && credentials.password) {
      const parsed = JSON.parse(credentials.password) as StoredTokens;
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve tokens from Keychain:', error);
    return null;
  }
}

/**
 * Clears tokens from Keychain.
 */
export async function clearTokens(): Promise<boolean> {
  try {
    const result = await Keychain.resetGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    return Boolean(result);
  } catch (error) {
    console.error('Failed to clear tokens from Keychain:', error);
    return false;
  }
}

/**
 * MMKV helper methods for high-performance key-value storage.
 */
export const LocalStorage = {
  setString(key: string, value: string): void {
    mmkv.set(key, value);
  },
  getString(key: string): string | null {
    return mmkv.getString(key) ?? null;
  },
  setObject<T>(key: string, value: T): void {
    mmkv.set(key, JSON.stringify(value));
  },
  getObject<T>(key: string): T | null {
    const val = mmkv.getString(key);
    if (!val) {
      return null;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  },
  remove(key: string): void {
    mmkv.delete(key);
  },
  clearAll(): void {
    mmkv.clearAll();
  },
};
