import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';

export interface BiometricAvailability {
  available: boolean;
  biometryType: string;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  signature?: string;
  error?: string;
}

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * Checks whether biometric hardware is present, enrolled, and supported.
   * Maps native biometry types to user-friendly titles.
   */
  public async isBiometricAvailable(): Promise<BiometricAvailability> {
    try {
      const {available, biometryType, error} =
        await this.rnBiometrics.isSensorAvailable();

      if (!available) {
        return {
          available: false,
          biometryType: 'None',
          error: error || 'Biometric sensor not available or not enrolled',
        };
      }

      let displayType = 'Biometric Authentication';
      switch (biometryType) {
        case BiometryTypes.FaceID:
          displayType = 'Face ID';
          break;
        case BiometryTypes.TouchID:
          displayType = 'Touch ID';
          break;
        case BiometryTypes.Biometrics:
          displayType = 'Fingerprint / Face Recognition';
          break;
        default:
          displayType = 'Biometrics';
          break;
      }

      return {
        available: true,
        biometryType: displayType,
      };
    } catch (err: any) {
      console.warn('[BiometricService] isSensorAvailable error:', err);
      return {
        available: false,
        biometryType: 'Unavailable',
        error: err?.message || 'Biometric check failed',
      };
    }
  }

  /**
   * Performs cryptographic biometric challenge-response signing.
   * If keys don't exist yet, creates them or falls back to prompt.
   */
  public async authenticate(
    reason = 'Confirm your identity to mark attendance',
    challengePayload?: string,
  ): Promise<BiometricAuthResult> {
    try {
      const availability = await this.isBiometricAvailable();
      if (!availability.available) {
        return {
          success: false,
          error: availability.error || 'Biometric authentication is not supported on this device.',
        };
      }

      // Check if biometric key pair exists
      const {keysExist} = await this.rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        await this.rnBiometrics.createKeys();
      }

      const payload = challengePayload || `${Date.now()}:attendance_auth`;

      const result = await this.rnBiometrics.createSignature({
        promptMessage: reason,
        payload,
      });

      if (result.success && result.signature) {
        return {
          success: true,
          signature: result.signature,
        };
      }

      return {
        success: false,
        error: 'Biometric verification cancelled or failed.',
      };
    } catch (err: any) {
      console.warn('[BiometricService] authenticate error:', err);
      // If user cancelled, report cleanly
      const isCancelled =
        err?.message?.includes('User cancellation') ||
        err?.message?.includes('cancelled');

      return {
        success: false,
        error: isCancelled
          ? 'Authentication was cancelled.'
          : err?.message || 'Failed to complete biometric authentication.',
      };
    }
  }
}

export const biometricService = new BiometricService();
