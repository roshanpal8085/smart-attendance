import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {teacherApi} from '../../services/teacherApi';
import {useAuthStore} from '../../store/authStore';
import {useSessionStore} from '../../store/sessionStore';
import {SessionCard} from '../../components/teacher/SessionCard';
import {TimetableCard} from '../../components/student/TimetableCard';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {EmptyState} from '../../components/common/EmptyState';
import {COLORS} from '../../utils/constants';
import type {TeacherTabScreenProps} from '../../types/navigation';
import type {TeacherDashboardData, TimetableSlot} from '../../types/api';

export const TeacherDashboardScreen: React.FC<
  TeacherTabScreenProps<'DashboardTab'>
> = ({navigation}) => {
  const user = useAuthStore((state) => state.user);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<TeacherDashboardData>({
    queryKey: ['teacherDashboard'],
    queryFn: teacherApi.getDashboard,
    staleTime: 30_000,
  });

  const handleStartFromSlot = (slot: TimetableSlot) => {
    navigation.navigate('StartSessionTab', {
      screen: 'StartSession',
    } as any);
  };

  const handleResumeActiveSession = () => {
    if (dashboardData?.active_session) {
      setActiveSession(dashboardData.active_session);
      navigation.navigate('StartSessionTab', {
        screen: 'LiveSession',
        params: {
          sessionId: dashboardData.active_session.id,
          session: dashboardData.active_session,
        },
      } as any);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading instructor dashboard..." />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Could Not Load Dashboard"
          description={(error as any)?.message || 'Failed to retrieve teacher portal data.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const activeSession = dashboardData?.active_session;
  const todayClasses = dashboardData?.today_classes || [];
  const stats = dashboardData?.stats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }>
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <View>
          <Text style={styles.greetingSub}>Instructor Portal</Text>
          <Text style={styles.greetingName}>
            Prof. {user?.last_name || user?.first_name || 'Instructor'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newSessionBtn}
          onPress={() =>
            navigation.navigate('StartSessionTab', {
              screen: 'StartSession',
            } as any)
          }
          activeOpacity={0.85}>
          <Icon name="add" size={18} color="#ffffff" style={styles.plusIcon} />
          <Text style={styles.newSessionText}>New Session</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Daily Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.total_classes_today}</Text>
            <Text style={styles.statLabel}>Classes Today</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={[styles.statNumber, {color: COLORS.success}]}>
              {stats.completed_today}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="time-outline" size={20} color={COLORS.warning} />
            <Text style={[styles.statNumber, {color: COLORS.warning}]}>
              {Math.max(0, stats.total_classes_today - stats.completed_today)}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      )}

      {/* Active Session Alert & Management */}
      {activeSession && (
        <View style={styles.activeSessionSection}>
          <Text style={styles.sectionTitle}>Active Attendance Session</Text>
          <SessionCard
            session={activeSession}
            onPress={handleResumeActiveSession}
          />
        </View>
      )}

      {/* Today's Classes List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
      </View>

      {todayClasses.length > 0 ? (
        todayClasses.map((slot, index) => (
          <TimetableCard
            key={slot.id || index}
            slot={slot}
            onPressCheckIn={handleStartFromSlot}
          />
        ))
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="No Scheduled Lectures"
          description="You do not have any lectures scheduled for today."
        />
      )}
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
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  plusIcon: {
    marginRight: 4,
  },
  newSessionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeSessionSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
});
