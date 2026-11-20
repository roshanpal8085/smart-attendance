import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {teacherApi} from '../../services/teacherApi';
import {useBLEAdvertising} from '../../hooks/useBLEAdvertising';
import {useSessionStore} from '../../store/sessionStore';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {COLORS, SESSION_DURATION_SECONDS} from '../../utils/constants';
import type {TeacherSessionScreenProps} from '../../types/navigation';
import type {SubjectInfo, SectionInfo, ClassroomInfo, AttendanceSession} from '../../types/api';

export const StartSessionScreen: React.FC<
  TeacherSessionScreenProps<'StartSession'>
> = ({navigation}) => {
  const queryClient = useQueryClient();
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const {startAdvertising} = useBLEAdvertising();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Teacher's Assigned Subjects
  const {data: subjects, isLoading: isSubjectsLoading} = useQuery<SubjectInfo[]>({
    queryKey: ['teacherSubjects'],
    queryFn: teacherApi.getAssignedSubjects,
  });

  // Set default subject
  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // 2. Fetch Sections for Selected Subject
  const {data: sections, isLoading: isSectionsLoading} = useQuery<SectionInfo[]>({
    queryKey: ['teacherSections', selectedSubjectId],
    queryFn: () => teacherApi.getSectionsForSubject(selectedSubjectId),
    enabled: Boolean(selectedSubjectId),
  });

  // Set default section
  useEffect(() => {
    if (sections && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  }, [sections]);

  // 3. Fetch Classrooms
  const {data: classrooms, isLoading: isClassroomsLoading} = useQuery<ClassroomInfo[]>({
    queryKey: ['teacherClassrooms'],
    queryFn: teacherApi.getClassrooms,
  });

  // Set default classroom
  useEffect(() => {
    if (classrooms && classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  // Identify selected classroom config to determine proximity mode
  const currentClassroom = classrooms?.find((c) => c.id === selectedClassroomId);
  const proximityMode = currentClassroom?.proximity_mode || 'fixed_beacon';
  const isTeacherPhoneMode = proximityMode === 'teacher_phone';

  // 4. Start Session Mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubjectId || !selectedSectionId || !selectedClassroomId) {
        throw new Error('Please select subject, section, and classroom.');
      }
      return teacherApi.startSession({
        subject_id: selectedSubjectId,
        section_id: selectedSectionId,
        classroom_id: selectedClassroomId,
        duration_seconds: SESSION_DURATION_SECONDS,
      });
    },
    onSuccess: async (session: AttendanceSession) => {
      setActiveSession(session);
      queryClient.invalidateQueries({queryKey: ['teacherDashboard']});

      // If mode is teacher_phone, initiate BLE Peripheral Advertising immediately
      if (session.proximity_mode === 'teacher_phone') {
        try {
          await startAdvertising(session.id, session.session_challenge);
        } catch (bleErr) {
          console.warn('Could not initiate BLE advertisement on phone:', bleErr);
          Alert.alert(
            'BLE Broadcast Warning',
            'Session opened on server, but phone Bluetooth broadcasting could not start. Please verify Bluetooth permissions.',
          );
        }
      }

      navigation.navigate('LiveSession', {
        sessionId: session.id,
        session,
      });
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.response?.data?.detail || err?.message || 'Failed to start session.',
      );
    },
  });

  if (isSubjectsLoading || isClassroomsLoading) {
    return <LoadingSpinner fullScreen message="Loading course configurations..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.introCard}>
        <View style={styles.introHeader}>
          <Icon name="radio" size={28} color={COLORS.primary} />
          <View style={styles.introTitleContainer}>
            <Text style={styles.introTitle}>Initiate Attendance Window</Text>
            <Text style={styles.introSubtitle}>
              Broadcasts a 2-minute secure attendance window for student biometric check-in.
            </Text>
          </View>
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={16} color={COLORS.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* 1. Subject Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>1. Select Subject Course</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalChips}>
          {subjects?.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.8}>
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {sub.code} - {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Section Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>2. Select Class Section</Text>
        {isSectionsLoading ? (
          <LoadingSpinner size="small" message="Loading sections..." />
        ) : (
          <View style={styles.wrapChips}>
            {sections?.map((sec) => {
              const isSelected = sec.id === selectedSectionId;
              return (
                <TouchableOpacity
                  key={sec.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedSectionId(sec.id)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {sec.name} (Sem {sec.semester})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Classroom Picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>3. Select Classroom Venue</Text>
        <View style={styles.wrapChips}>
          {classrooms?.map((room) => {
            const isSelected = room.id === selectedClassroomId;
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedClassroomId(room.id)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}>
                  {room.name} ({room.room_number})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Proximity Mode Informational Card */}
      <View style={styles.modeCard}>
        <View style={styles.modeHeader}>
          <Icon
            name={isTeacherPhoneMode ? 'phone-portrait' : 'hardware-chip'}
            size={22}
            color={COLORS.primary}
          />
          <Text style={styles.modeCardTitle}>
            {isTeacherPhoneMode
              ? 'Mode: Teacher Phone BLE Broadcast'
              : 'Mode: Fixed Classroom BLE Beacon'}
          </Text>
        </View>
        <Text style={styles.modeCardDescription}>
          {isTeacherPhoneMode
            ? 'Your phone will advertise a secure Bluetooth LE session challenge token. Students must remain near your phone during verification.'
            : 'Proximity will be verified against the physical BLE hardware beacon installed in this classroom.'}
        </Text>
      </View>

      {/* Start Session CTA Button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          startSessionMutation.isPending && styles.buttonDisabled,
        ]}
        onPress={() => startSessionMutation.mutate()}
        disabled={startSessionMutation.isPending}
        activeOpacity={0.85}>
        {startSessionMutation.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Icon name="play" size={20} color="#ffffff" style={styles.playIcon} />
            <Text style={styles.startButtonText}>Launch Attendance Window (2 min)</Text>
          </>
        )}
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
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  introTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  introSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    flex: 1,
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  horizontalChips: {
    paddingVertical: 4,
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  modeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginVertical: 8,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  modeCardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  playIcon: {
    marginRight: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
