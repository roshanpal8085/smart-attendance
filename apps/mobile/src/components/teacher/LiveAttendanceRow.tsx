import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {StatusBadge} from '../common/StatusBadge';
import {COLORS} from '../../utils/constants';
import {formatTime} from '../../utils/dateUtils';
import type {LiveStudentAttendance} from '../../types/api';

interface LiveAttendanceRowProps {
  student: LiveStudentAttendance;
}

export const LiveAttendanceRow: React.FC<LiveAttendanceRowProps> = ({student}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <Text style={styles.studentName} numberOfLines={1}>
          {student.student_name}
        </Text>
        <Text style={styles.rollNumber}>{student.roll_number}</Text>
      </View>

      <View style={styles.rightCol}>
        <StatusBadge status={student.status} size="small" />
        {student.status === 'present' && student.marked_at && (
          <Text style={styles.markedTime}>{formatTime(student.marked_at)}</Text>
        )}
        {student.status === 'verifying' && student.rssi !== undefined && (
          <Text style={styles.rssiText}>{student.rssi} dBm</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  markedTime: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
    marginTop: 4,
  },
  rssiText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '500',
    marginTop: 4,
  },
});
