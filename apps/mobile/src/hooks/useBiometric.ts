import {useState, useEffect, useCallback} from 'react';
import {biometricService} from '../services/biometricService';

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState('Checking...');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    try {
      const res = await biometricService.isBiometricAvailable();
      setIsAvailable(res.available);
      setBiometryType(res.biometryType);
      if (!res.available && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setIsAvailable(false);
      setBiometryType('Unavailable');
      setError(err?.message || 'Biometric check failed');
    }
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const authenticate = useCallback(
    async (
      reason = 'Confirm your biometric identity to mark attendance',
      challenge?: string,
    ): Promise<{success: boolean; signature?: string; error?: string}> => {
      setIsAuthenticating(true);
      setError(null);

      try {
        const result = await biometricService.authenticate(reason, challenge);

        if (result.success && result.signature) {
          setSignature(result.signature);
          setIsAuthenticating(false);
          return {success: true, signature: result.signature};
        } else {
          const errMsg = result.error || 'Authentication was unsuccessful';
          setError(errMsg);
          setIsAuthenticating(false);
          return {success: false, error: errMsg};
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Biometric authentication failed';
        setError(errMsg);
        setIsAuthenticating(false);
        return {success: false, error: errMsg};
      }
    },
    [],
  );

  return {
    isAvailable,
    biometryType,
    isAuthenticating,
    signature,
    error,
    authenticate,
    checkAvailability,
  };
}
