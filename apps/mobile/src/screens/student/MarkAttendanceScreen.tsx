import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useBiometric} from '../../hooks/useBiometric';
import {useAttendance} from '../../hooks/useAttendance';
import {CountdownTimer} from '../../components/teacher/CountdownTimer';
import {COLORS} from '../../utils/constants';
import {formatHumanDate} from '../../utils/dateUtils';
import type {StudentDashboardScreenProps} from '../../types/navigation';
import type {MarkAttendanceResponse} from '../../types/api';

type StepState = 'idle' | 'authenticating' | 'submitting' | 'success' | 'failed';

export const MarkAttendanceScreen: React.FC<
  StudentDashboardScreenProps<'MarkAttendance'>
> = ({route, navigation}) => {
  const {session, initialRssi = -70} = route.params;

  const [step, setStep] = useState<StepState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<MarkAttendanceResponse | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const {
    isAvailable: isBiometricAvailable,
    biometryType,
    authenticate,
  } = useBiometric();

  const {markAttendance} = useAttendance();

  const handleStartAuthentication = async () => {
    if (sessionExpired) {
      setErrorMessage('This attendance session has already closed.');
      return;
    }

    setErrorMessage(null);
    setStep('authenticating');

    try {
      // 1. Biometric Authentication & Cryptographic Signature
      const authResult = await authenticate(
        `Verify identity for ${session.subject_name}`,
        `${session.id}:${Date.now()}`,
      );

      if (!authResult.success) {
        setErrorMessage(
          authResult.error ||
            'Biometric verification failed. Please ensure your fingerprint or face is enrolled in device settings.',
        );
        setStep('failed');
        return;
      }

      // 2. Submit to backend
      setStep('submitting');
      const response = await markAttendance({
        session_id: session.id,
        biometric_signature: authResult.signature || 'biometric_verified',
        client_timestamp: new Date().toISOString(),
        rssi: initialRssi,
        challenge_response: session.session_challenge,
      });

      setSuccessResult(response);
      setStep('success');
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.detail ||
        err?.message ||
        'Server rejected attendance submission. Please retry.';
      setErrorMessage(serverMsg);
      setStep('failed');
    }
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  // SUCCESS VIEW
  if (step === 'success' && successResult) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Icon name="checkmark-done" size={56} color={COLORS.success} />
          </View>

          <Text style={styles.successTitle}>Attendance Recorded!</Text>
          <Text style={styles.successSubtitle}>
            Your physical presence and biometric identity were successfully validated.
          </Text>

          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Subject</Text>
              <Text style={styles.receiptValue}>{session.subject_name}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Classroom</Text>
              <Text style={styles.receiptValue}>{session.classroom_name}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Date</Text>
              <Text style={styles.receiptValue}>
                {formatHumanDate(successResult.marked_at || new Date().toISOString())}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Verification Ref</Text>
              <Text style={styles.receiptCode}>
                {successResult.reference_id || 'ATT-VERIFIED'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.85}>
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 2-Minute Server Countdown Banner */}
      <CountdownTimer
        expiresAt={session.expires_at}
        onExpire={() => setSessionExpired(true)}
      />

      {/* Session Details Card */}
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={styles.subjectCode}>{session.subject_code}</Text>
          <Text style={styles.classroomBadge}>{session.classroom_name}</Text>
        </View>

        <Text style={styles.subjectTitle}>{session.subject_name}</Text>

        <View style={styles.metaRow}>
          <Icon name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>Instructor: {session.teacher_name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="people-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>Section: {session.section_name}</Text>
        </View>
      </View>

      {/* Sensor / Biometric Status */}
      <View style={styles.biometricStatusBox}>
        <Icon
          name={isBiometricAvailable ? 'finger-print' : 'alert-circle-outline'}
          size={36}
          color={isBiometricAvailable ? COLORS.primary : COLORS.warning}
        />
        <View style={styles.biometricStatusText}>
          <Text style={styles.biometricTypeTitle}>
            {isBiometricAvailable ? biometryType : 'Biometric Sensor Alert'}
          </Text>
          <Text style={styles.biometricTypeSub}>
            {isBiometricAvailable
              ? 'Required for single-device anti-proxy security'
              : 'Device biometric hardware not enrolled. Please configure device passcode or biometrics.'}
          </Text>
        </View>
      </View>

      {/* Error Message Box */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={COLORS.error} style={styles.errorIcon} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {/* State Actions */}
      <View style={styles.actionContainer}>
        {step === 'authenticating' ? (
          <View style={styles.processingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Awaiting Biometric Confirmation...</Text>
          </View>
        ) : step === 'submitting' ? (
          <View style={styles.processingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Submitting to University Cloud...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.authButton,
              sessionExpired && styles.buttonDisabled,
            ]}
            onPress={handleStartAuthentication}
            disabled={sessionExpired}
            activeOpacity={0.85}>
            <Icon name="finger-print" size={24} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.authButtonText}>
              {step === 'failed' ? 'Retry Biometric Auth' : 'Authenticate & Mark'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.securityDisclaimer}>
        By clicking authenticate, your cryptographically signed device token and verified BLE signal will be committed to the college attendance ledger.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  classroomBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  biometricStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  biometricStatusText: {
    marginLeft: 14,
    flex: 1,
  },
  biometricTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  biometricTypeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.error,
    flex: 1,
    lineHeight: 18,
  },
  actionContainer: {
    marginVertical: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnIcon: {
    marginRight: 10,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  processingState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  securityDisclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  successCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  receiptCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  doneButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
