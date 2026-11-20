import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {useBLEScanning} from '../../hooks/useBLEScanning';
import {usePresenceVerification} from '../../hooks/usePresenceVerification';
import {studentApi} from '../../services/studentApi';
import {useSessionStore} from '../../store/sessionStore';
import {ProximityStatusCard} from '../../components/student/ProximityStatusCard';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {COLORS, PRESENCE_REQUIRED_SECONDS} from '../../utils/constants';
import type {StudentDashboardScreenProps} from '../../types/navigation';
import type {AttendanceSession} from '../../types/api';

export const ProximityScreen: React.FC<
  StudentDashboardScreenProps<'Proximity'>
> = ({route, navigation}) => {
  const paramSession = route.params?.session;
  const paramBeaconUuid = route.params?.classroomBeaconUuid;

  const activeSessionStore = useSessionStore((state) => state.activeSession);

  // Fetch or refresh active session from backend
  const {
    data: activeSessionData,
    isLoading: isSessionLoading,
    refetch: refetchSession,
    isRefetching,
  } = useQuery<AttendanceSession | null>({
    queryKey: ['studentActiveSession'],
    queryFn: studentApi.getActiveSession,
    initialData: paramSession || activeSessionStore,
    refetchInterval: 15_000,
  });

  const session = activeSessionData || paramSession || activeSessionStore;
  const classroomBeaconUuid = session?.classroom_beacon_uuid || paramBeaconUuid;
  const sessionChallenge = session?.session_challenge;

  // BLE Proximity Scanning Hook
  const {
    bleState,
    permissionGranted,
    proximityState,
    signalStrength,
    presenceWindowSeconds,
    requestPermissions,
  } = useBLEScanning({
    classroomBeaconUuid,
    sessionChallenge,
    sessionId: session?.id,
    enabled: true,
    requiredSeconds: PRESENCE_REQUIRED_SECONDS,
  });

  // Backend Presence Verification Polling
  const {
    windowSeconds: serverWindowSeconds,
    isEligible: serverEligible,
  } = usePresenceVerification({
    classroomId: session?.classroom_id,
    sessionId: session?.id,
    enabled: Boolean(session),
  });

  // Effective eligibility considers both local continuous presence and server confirmation
  const isEligible =
    serverEligible ||
    proximityState === 'eligible' ||
    presenceWindowSeconds >= PRESENCE_REQUIRED_SECONDS;

  const canMarkAttendance = isEligible && Boolean(session) && session?.status === 'active';

  const handleProceedToMark = () => {
    if (session) {
      navigation.navigate('MarkAttendance', {
        session,
        initialRssi: signalStrength ?? -70,
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetchSession}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }>
      {/* Session Details Card */}
      {session ? (
        <View style={styles.sessionHeaderCard}>
          <View style={styles.sessionPillRow}>
            <View style={styles.sessionActivePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.sessionActiveText}>Active Window</Text>
            </View>
            <Text style={styles.subjectCode}>{session.subject_code}</Text>
          </View>

          <Text style={styles.subjectTitle}>{session.subject_name}</Text>

          <View style={styles.sessionMetaGrid}>
            <View style={styles.metaRow}>
              <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{session.classroom_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Icon name="person-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{session.teacher_name}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noSessionCard}>
          <Icon name="information-circle-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.noSessionTitle}>No Active Class Session</Text>
          <Text style={styles.noSessionSubtitle}>
            Scanning for classroom beacons. When your instructor starts an attendance session, it will synchronize here.
          </Text>
        </View>
      )}

      {/* Main Proximity Status Visual Card */}
      <ProximityStatusCard
        proximityState={proximityState}
        signalStrength={signalStrength}
        presenceWindowSeconds={Math.max(presenceWindowSeconds, serverWindowSeconds)}
        requiredSeconds={PRESENCE_REQUIRED_SECONDS}
        classroomName={session?.classroom_name}
        onRequestPermissions={requestPermissions}
      />

      {/* Dwell Verification Explainer */}
      <View style={styles.infoBox}>
        <Icon name="shield-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Physical Presence Rule</Text>
          <Text style={styles.infoDescription}>
            Students must be physically in the classroom for a minimum continuous window of 15 minutes to unlock biometric check-in.
          </Text>
        </View>
      </View>

      {/* Mark Attendance Action CTA */}
      <TouchableOpacity
        style={[
          styles.markAttendanceButton,
          !canMarkAttendance && styles.buttonDisabled,
        ]}
        onPress={handleProceedToMark}
        disabled={!canMarkAttendance}
        activeOpacity={0.85}>
        <Icon
          name="finger-print"
          size={20}
          color="#ffffff"
          style={styles.buttonIcon}
        />
        <Text style={styles.markAttendanceButtonText}>
          {canMarkAttendance
            ? 'Mark Attendance with Biometrics'
            : !session
            ? 'Awaiting Active Session'
            : 'Fulfilling Presence Requirement...'}
        </Text>
      </TouchableOpacity>
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
  sessionHeaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  sessionActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  sessionMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  noSessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  noSessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 4,
  },
  noSessionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  markAttendanceButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
