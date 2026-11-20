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
import {studentApi} from '../../services/studentApi';
import {useAuthStore} from '../../store/authStore';
import {useSessionStore} from '../../store/sessionStore';
import {AttendanceSummaryCard} from '../../components/student/AttendanceSummaryCard';
import {TimetableCard} from '../../components/student/TimetableCard';
import {AttendanceHistoryItem} from '../../components/student/AttendanceHistoryItem';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {EmptyState} from '../../components/common/EmptyState';
import {COLORS} from '../../utils/constants';
import type {StudentDashboardScreenProps} from '../../types/navigation';
import type {TimetableSlot} from '../../types/api';

export const StudentDashboardScreen: React.FC<
  StudentDashboardScreenProps<'StudentDashboard'>
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
  } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: studentApi.getDashboard,
    staleTime: 30_000,
  });

  const handleCheckIn = (slot?: TimetableSlot) => {
    if (dashboardData?.active_session) {
      setActiveSession(dashboardData.active_session);
      navigation.navigate('Proximity', {
        session: dashboardData.active_session,
        classroomBeaconUuid: dashboardData.active_session.classroom_beacon_uuid,
      });
    } else {
      navigation.navigate('Proximity', {});
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading student dashboard..." />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Could Not Load Dashboard"
          description={
            (error as any)?.message ||
            'Unable to connect to college attendance service. Please pull to refresh.'
          }
          actionLabel="Try Again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const upcomingClasses = dashboardData?.upcoming_classes?.slice(0, 2) || [];
  const recentHistory = dashboardData?.recent_history?.slice(0, 5) || [];
  const activeSession = dashboardData?.active_session;

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
      {/* Top Greeting Header */}
      <View style={styles.greetingHeader}>
        <View>
          <Text style={styles.greetingSub}>Welcome back,</Text>
          <Text style={styles.greetingName}>
            {user ? `${user.first_name} ${user.last_name}` : 'Student'}
          </Text>
        </View>

        {activeSession && (
          <TouchableOpacity
            style={styles.activeSessionBanner}
            onPress={() => handleCheckIn()}
            activeOpacity={0.85}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeBannerText}>Session Active</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Attendance Session Callout Banner */}
      {activeSession && (
        <View style={styles.liveNoticeCard}>
          <View style={styles.liveNoticeLeft}>
            <Icon name="radio" size={24} color={COLORS.primary} />
            <View style={styles.liveNoticeTextContainer}>
              <Text style={styles.liveNoticeTitle}>
                {activeSession.subject_name}
              </Text>
              <Text style={styles.liveNoticeSub}>
                Attendance window open in {activeSession.classroom_name}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => handleCheckIn()}
            activeOpacity={0.85}>
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overall Attendance Summary Gauge */}
      {dashboardData?.summary && (
        <AttendanceSummaryCard summary={dashboardData.summary} />
      )}

      {/* Today's Timetable Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Classes</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TimetableTab' as any)}
          activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Full Schedule</Text>
        </TouchableOpacity>
      </View>

      {upcomingClasses.length > 0 ? (
        upcomingClasses.map((slot, index) => (
          <TimetableCard
            key={slot.id || index}
            slot={slot}
            isNext={index === 0 && !slot.is_current}
            onPressCheckIn={() => handleCheckIn(slot)}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No classes remaining today</Text>
        </View>
      )}

      {/* Recent Attendance History Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AttendanceTab' as any)}
          activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentHistory.length > 0 ? (
        recentHistory.map((item) => (
          <AttendanceHistoryItem key={item.id} item={item} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No recent attendance logs</Text>
        </View>
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
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  activeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  liveNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  liveNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  liveNoticeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  liveNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  liveNoticeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyCardText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
