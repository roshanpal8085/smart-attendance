import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../utils/constants';
import type {AttendanceSummary} from '../../types/api';

interface AttendanceSummaryCardProps {
  summary: AttendanceSummary;
}

export const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({
  summary,
}) => {
  const percentage = Math.min(100, Math.max(0, summary.attendance_percentage));
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedValue]);

  let statusColor = COLORS.success;
  let statusBadge = 'Good Standing';
  if (percentage < 65) {
    statusColor = COLORS.error;
    statusBadge = 'Critical Shortage';
  } else if (percentage < 75) {
    statusColor = COLORS.warning;
    statusBadge = 'Below 75% Target';
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.cardTitle}>Overall Attendance</Text>
        <View style={[styles.statusBadge, {backgroundColor: `${statusColor}18`}]}>
          <Text style={[styles.statusBadgeText, {color: statusColor}]}>
            {statusBadge}
          </Text>
        </View>
      </View>

      <View style={styles.indicatorContainer}>
        {/* Circular Progress Gauge */}
        <View style={styles.circleOuter}>
          <View style={[styles.circleRing, {borderColor: `${statusColor}30`}]}>
            <View style={[styles.circleInner, {borderColor: statusColor}]}>
              <Text style={[styles.percentageNumber, {color: statusColor}]}>
                {percentage.toFixed(1)}%
              </Text>
              <Text style={styles.percentageLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsColumn}>
          <View style={styles.statBox}>
            <View style={[styles.statDot, {backgroundColor: COLORS.success}]} />
            <View>
              <Text style={styles.statValue}>{summary.attended_classes}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statDot, {backgroundColor: COLORS.error}]} />
            <View>
              <Text style={styles.statValue}>{summary.absent_classes}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statDot, {backgroundColor: COLORS.primaryLight}]} />
            <View>
              <Text style={styles.statValue}>{summary.total_classes}</Text>
              <Text style={styles.statLabel}>Total Classes</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Icon name="information-circle-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.footerNoteText}>
          75% attendance required to appear for university semester examinations.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  circleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafbfc',
  },
  percentageNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  percentageLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statsColumn: {
    flex: 1,
    marginLeft: 24,
    justifyContent: 'space-between',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  footerNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});
