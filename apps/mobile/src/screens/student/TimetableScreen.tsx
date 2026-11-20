import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import dayjs from 'dayjs';
import {studentApi} from '../../services/studentApi';
import {TimetableCard} from '../../components/student/TimetableCard';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {EmptyState} from '../../components/common/EmptyState';
import {COLORS} from '../../utils/constants';
import type {StudentTabScreenProps} from '../../types/navigation';
import type {TimetableSlot} from '../../types/api';

const DAYS = [
  {day: 1, label: 'Mon'},
  {day: 2, label: 'Tue'},
  {day: 3, label: 'Wed'},
  {day: 4, label: 'Thu'},
  {day: 5, label: 'Fri'},
  {day: 6, label: 'Sat'},
];

export const StudentTimetableScreen: React.FC<
  StudentTabScreenProps<'TimetableTab'>
> = ({navigation}) => {
  // Today's day of week (1 to 6, if Sunday default to Monday 1)
  const currentDayOfWeek = dayjs().day();
  const initialDay = currentDayOfWeek >= 1 && currentDayOfWeek <= 6 ? currentDayOfWeek : 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const {
    data: timetable,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<TimetableSlot[]>({
    queryKey: ['studentTimetable', selectedDay],
    queryFn: () => studentApi.getTimetable(selectedDay),
  });

  const handleCheckIn = (slot: TimetableSlot) => {
    navigation.navigate('DashboardTab', {
      screen: 'Proximity',
      params: {classroomBeaconUuid: slot.classroom_id},
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Day Selector Tabs */}
      <View style={styles.daySelectorContainer}>
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.day;
          return (
            <TouchableOpacity
              key={d.day}
              style={[styles.dayTab, isSelected && styles.dayTabSelected]}
              onPress={() => setSelectedDay(d.day)}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.dayTabText,
                  isSelected && styles.dayTabTextSelected,
                ]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timetable List Content */}
      {isLoading ? (
        <LoadingSpinner message="Fetching timetable schedule..." />
      ) : isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Could Not Load Timetable"
          description={(error as any)?.message || 'Failed to retrieve classes.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }>
          {timetable && timetable.length > 0 ? (
            timetable.map((slot, index) => (
              <TimetableCard
                key={slot.id || index}
                slot={slot}
                onPressCheckIn={handleCheckIn}
              />
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No Classes Scheduled"
              description={`You have no lectures scheduled for ${
                DAYS.find((d) => d.day === selectedDay)?.label || 'this day'
              }.`}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  daySelectorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-between',
  },
  dayTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  dayTabSelected: {
    backgroundColor: COLORS.primary,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayTabTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
