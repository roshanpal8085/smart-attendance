import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {StatusBadge} from '../common/StatusBadge';
import {COLORS} from '../../utils/constants';
import {formatHumanDate} from '../../utils/dateUtils';
import type {AttendanceHistoryItem as HistoryItemType} from '../../types/api';

interface AttendanceHistoryItemProps {
  item: HistoryItemType;
}

export const AttendanceHistoryItem: React.FC<AttendanceHistoryItemProps> = ({
  item,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.headerRow}>
          <Text style={styles.subjectCode}>{item.subject_code}</Text>
          <Text style={styles.dateText}>{formatHumanDate(item.date)}</Text>
        </View>

        <Text style={styles.subjectName} numberOfLines={1}>
          {item.subject_name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Icon name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{item.time_slot}</Text>
          </View>
          <View style={styles.metaCol}>
            <Icon name="location-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{item.classroom}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightContent}>
        <StatusBadge status={item.status} size="small" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leftContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
});
