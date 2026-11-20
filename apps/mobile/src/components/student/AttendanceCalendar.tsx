import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import {COLORS} from '../../utils/constants';
import type {AttendanceDateMatrix, DayAttendanceStatus} from '../../types/api';

interface AttendanceCalendarProps {
  currentDate: dayjs.Dayjs;
  matrix: AttendanceDateMatrix;
  onMonthChange: (newDate: dayjs.Dayjs) => void;
  onSelectDate?: (dateString: string, status?: DayAttendanceStatus) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  currentDate,
  matrix,
  onMonthChange,
  onSelectDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const startOfMonth = currentDate.startOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 (Sun) - 6 (Sat)
  const today = dayjs();

  const handlePrevMonth = () => {
    onMonthChange(currentDate.subtract(1, 'month'));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    onMonthChange(currentDate.add(1, 'month'));
    setSelectedDay(null);
  };

  // Generate calendar grid cells (42 cells: 6 weeks x 7 days)
  const cells = [];
  // Empty padding cells for previous month days
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const getStatusColor = (status: DayAttendanceStatus) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'late':
        return COLORS.warning;
      case 'no_class':
        return '#cbd5e1';
      case 'future':
      default:
        return '#ffffff';
    }
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header with Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrevMonth}
          activeOpacity={0.7}>
          <Icon name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{currentDate.format('MMMM YYYY')}</Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextMonth}
          activeOpacity={0.7}>
          <Icon name="chevron-forward" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid of Days */}
      <View style={styles.grid}>
        {cells.map((dayNum, index) => {
          if (dayNum === null) {
            return <View key={`pad-${index}`} style={styles.cellEmpty} />;
          }

          const dateStr = currentDate.date(dayNum).format('YYYY-MM-DD');
          const dateObj = currentDate.date(dayNum);
          const isFuture = dateObj.isAfter(today, 'day');
          const isToday = dateObj.isSame(today, 'day');
          const isSelected = selectedDay === dateStr;

          const record = matrix[dateStr];
          let status: DayAttendanceStatus = 'no_class';

          if (isFuture) {
            status = 'future';
          } else if (record) {
            status = record.status;
          }

          const cellBgColor = getStatusColor(status);
          const isTextWhite =
            status === 'present' || status === 'absent' || status === 'late';

          return (
            <TouchableOpacity
              key={`day-${dayNum}`}
              style={[
                styles.dayCell,
                {backgroundColor: cellBgColor},
                status === 'future' && styles.futureCell,
                isSelected && styles.selectedCell,
                isToday && styles.todayOutline,
              ]}
              onPress={() => {
                setSelectedDay(dateStr);
                onSelectDate?.(dateStr, status);
              }}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.dayText,
                  isTextWhite ? styles.dayTextWhite : styles.dayTextDark,
                  isSelected && styles.dayTextSelected,
                ]}>
                {dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.success}]} />
          <Text style={styles.legendText}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.error}]} />
          <Text style={styles.legendText}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: COLORS.warning}]} />
          <Text style={styles.legendText}>Late</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#cbd5e1'}]} />
          <Text style={styles.legendText}>No Class</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendFuture]} />
          <Text style={styles.legendText}>Future</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellEmpty: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  futureCell: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  todayOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedCell: {
    transform: [{scale: 1.1}],
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextWhite: {
    color: '#ffffff',
  },
  dayTextDark: {
    color: COLORS.text,
  },
  dayTextSelected: {
    fontWeight: '800',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendFuture: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
