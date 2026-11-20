import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {teacherApi} from '../../services/teacherApi';
import {SessionCard} from '../../components/teacher/SessionCard';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {EmptyState} from '../../components/common/EmptyState';
import {COLORS} from '../../utils/constants';
import type {TeacherTabScreenProps} from '../../types/navigation';
import type {AttendanceSession} from '../../types/api';

export const TeacherHistoryScreen: React.FC<
  TeacherTabScreenProps<'HistoryTab'>
> = ({navigation}) => {
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<AttendanceSession[]>({
    queryKey: ['teacherSessionHistory'],
    queryFn: () => teacherApi.getSessionHistory({limit: 50}),
  });

  const handlePressSession = (session: AttendanceSession) => {
    navigation.navigate('StartSessionTab', {
      screen: 'LiveSession',
      params: {
        sessionId: session.id,
        session,
      },
    } as any);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading past session archives..." />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Could Not Load History"
          description={(error as any)?.message || 'Failed to retrieve attendance logs.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
          />
        }>
        <Text style={styles.pageTitle}>Attendance History</Text>
        <Text style={styles.pageSub}>
          Past attendance sessions and completed lecture logs
        </Text>

        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={handlePressSession}
            />
          ))
        ) : (
          <EmptyState
            icon="archive-outline"
            title="No Past Sessions"
            description="You have not launched any attendance sessions yet."
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
});
