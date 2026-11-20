import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {StatusBadge} from '../common/StatusBadge';
import {COLORS} from '../../utils/constants';
import {formatHumanDate, formatTime} from '../../utils/dateUtils';
import type {AttendanceSession} from '../../types/api';

interface SessionCardProps {
  session: AttendanceSession;
  onPress: (session: AttendanceSession) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({session, onPress}) => {
  const isActive = session.status === 'active';
  const isTeacherPhone = session.proximity_mode === 'teacher_phone';

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.activeCard]}
      onPress={() => onPress(session)}
      activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Text style={styles.subjectCode}>{session.subject_code}</Text>
          <View
            style={[
              styles.modePill,
              isTeacherPhone ? styles.modePhone : styles.modeBeacon,
            ]}>
            <Icon
              name={isTeacherPhone ? 'phone-portrait-outline' : 'radio-outline'}
              size={12}
              color={isTeacherPhone ? COLORS.accent : COLORS.primary}
              style={styles.modeIcon}
            />
            <Text
              style={[
                styles.modeText,
                {color: isTeacherPhone ? COLORS.accent : COLORS.primary},
              ]}>
              {isTeacherPhone ? 'Phone BLE' : 'Beacon'}
            </Text>
          </View>
        </View>

        <StatusBadge status={session.status} size="small" />
      </View>

      <Text style={styles.subjectName} numberOfLines={1}>
        {session.subject_name}
      </Text>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="people-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{session.section_name}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{session.classroom_name}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{formatHumanDate(session.start_time)}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.timeStarted}>
          Started: {formatTime(session.start_time)}
        </Text>
        <View style={styles.actionPrompt}>
          <Text
            style={[
              styles.actionPromptText,
              {color: isActive ? COLORS.primary : COLORS.textSecondary},
            ]}>
            {isActive ? 'Manage Live Session' : 'View Session'}
          </Text>
          <Icon
            name="chevron-forward"
            size={14}
            color={isActive ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activeCard: {
    borderColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  modePhone: {
    backgroundColor: '#f0fdfa',
  },
  modeBeacon: {
    backgroundColor: '#eff6ff',
  },
  modeIcon: {
    marginRight: 4,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginVertical: 2,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  timeStarted: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
});
