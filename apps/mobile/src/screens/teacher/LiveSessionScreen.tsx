import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {useWebSocket} from '../../hooks/useWebSocket';
import {useBLEAdvertising} from '../../hooks/useBLEAdvertising';
import {teacherApi} from '../../services/teacherApi';
import {useSessionStore} from '../../store/sessionStore';
import {CountdownTimer} from '../../components/teacher/CountdownTimer';
import {LiveAttendanceRow} from '../../components/teacher/LiveAttendanceRow';
import {COLORS} from '../../utils/constants';
import type {TeacherSessionScreenProps} from '../../types/navigation';

export const LiveSessionScreen: React.FC<
  TeacherSessionScreenProps<'LiveSession'>
> = ({route, navigation}) => {
  const {sessionId, session} = route.params;
  const queryClient = useQueryClient();
  const resetSession = useSessionStore((state) => state.resetSession);
  const {isAdvertising, stopAdvertising} = useBLEAdvertising();

  const [sessionCompleted, setSessionCompleted] = useState(false);

  // WebSocket Live Updates Connection
  const {liveStatus, isConnected, refreshStatus} = useWebSocket({
    sessionId,
    enabled: !sessionCompleted,
  });

  // End Session Mutation
  const endSessionMutation = useMutation({
    mutationFn: () => teacherApi.endSession(sessionId),
    onSuccess: async () => {
      await stopAdvertising();
      resetSession();
      queryClient.invalidateQueries({queryKey: ['teacherDashboard']});
      setSessionCompleted(true);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error Ending Session',
        err?.response?.data?.detail || 'Failed to terminate session on server.',
      );
    },
  });

  const handleCountdownExpired = async () => {
    await stopAdvertising();
    setSessionCompleted(true);
  };

  const handleConfirmEndSession = () => {
    Alert.alert(
      'End Attendance Session',
      'Are you sure you want to close this attendance window early?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => endSessionMutation.mutate(),
        },
      ],
    );
  };

  const handleReturnToDashboard = () => {
    navigation.popToTop();
  };

  const isTeacherPhone = session.proximity_mode === 'teacher_phone';
  const totalEnrolled = liveStatus?.total_enrolled || 0;
  const presentCount = liveStatus?.present_count || 0;
  const absentCount = liveStatus?.absent_count || Math.max(0, totalEnrolled - presentCount);
  const verifyingCount = liveStatus?.verifying_count || 0;
  const students = liveStatus?.students || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Session Metadata Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.subjectCode}>{session.subject_code}</Text>
          <View style={styles.liveIndicator}>
            <View
              style={[
                styles.pulseDot,
                {backgroundColor: isConnected ? COLORS.success : COLORS.warning},
              ]}
            />
            <Text style={styles.liveIndicatorText}>
              {isConnected ? 'LIVE WS' : 'CONNECTING'}
            </Text>
          </View>
        </View>

        <Text style={styles.subjectName}>{session.subject_name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Section: {session.section_name}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{session.classroom_name}</Text>
        </View>
      </View>

      {/* 2-Minute Server Countdown */}
      <CountdownTimer
        expiresAt={session.expires_at}
        onExpire={handleCountdownExpired}
      />

      {/* BLE Phone Advertising Indicator (if teacher_phone mode) */}
      {isTeacherPhone && (
        <View style={styles.advertisingBanner}>
          <Icon
            name="bluetooth"
            size={18}
            color={isAdvertising ? COLORS.accent : COLORS.textSecondary}
          />
          <Text style={styles.advertisingText}>
            {isAdvertising
              ? 'Phone Bluetooth Broadcasting Active'
              : 'Bluetooth Broadcasting Suspended'}
          </Text>
        </View>
      )}

      {/* Live Stats Counters */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalEnrolled}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>

        <View style={[styles.statBox, styles.statBoxPresent]}>
          <Text style={[styles.statNumber, {color: COLORS.success}]}>
            {presentCount}
          </Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        <View style={[styles.statBox, styles.statBoxAbsent]}>
          <Text style={[styles.statNumber, {color: COLORS.error}]}>
            {absentCount}
          </Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        <View style={[styles.statBox, styles.statBoxVerifying]}>
          <Text style={[styles.statNumber, {color: COLORS.warning}]}>
            {verifyingCount}
          </Text>
          <Text style={styles.statLabel}>Verifying</Text>
        </View>
      </View>

      {/* Real-Time Student Roster */}
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>Class Roster & Real-Time Check-In</Text>
        <TouchableOpacity onPress={refreshStatus} activeOpacity={0.7}>
          <Icon name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {students.length > 0 ? (
        students.map((student) => (
          <LiveAttendanceRow key={student.student_id} student={student} />
        ))
      ) : (
        <View style={styles.emptyStudentsCard}>
          <Icon name="people-outline" size={32} color={COLORS.textSecondary} />
          <Text style={styles.emptyStudentsText}>
            Waiting for student attendance submissions...
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {sessionCompleted ? (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleReturnToDashboard}
            activeOpacity={0.85}>
            <Text style={styles.doneButtonText}>Session Completed - Return</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.endButton,
              endSessionMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleConfirmEndSession}
            disabled={endSessionMutation.isPending}
            activeOpacity={0.85}>
            {endSessionMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.endButtonText}>Close Attendance Window Now</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaDot: {
    marginHorizontal: 8,
    color: COLORS.textSecondary,
  },
  advertisingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdfa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 8,
  },
  advertisingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBoxPresent: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  statBoxAbsent: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  statBoxVerifying: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  rosterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyStudentsCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStudentsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 24,
  },
  endButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
