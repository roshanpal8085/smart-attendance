import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../utils/constants';
import {formatTime} from '../../utils/dateUtils';
import type {TimetableSlot} from '../../types/api';

interface TimetableCardProps {
  slot: TimetableSlot;
  onPressCheckIn?: (slot: TimetableSlot) => void;
  isNext?: boolean;
}

export const TimetableCard: React.FC<TimetableCardProps> = ({
  slot,
  onPressCheckIn,
  isNext = false,
}) => {
  const isCurrent = slot.is_current;

  return (
    <View
      style={[
        styles.card,
        isCurrent ? styles.cardActive : isNext ? styles.cardNext : styles.cardDefault,
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.subjectCode}>{slot.subject_code}</Text>
          {isCurrent && (
            <View style={styles.nowBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.nowBadgeText}>HAPPENING NOW</Text>
            </View>
          )}
          {isNext && !isCurrent && (
            <View style={styles.nextBadge}>
              <Text style={styles.nextBadgeText}>UPCOMING</Text>
            </View>
          )}
        </View>

        <View style={styles.timeContainer}>
          <Icon name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.timeText}>
            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
          </Text>
        </View>
      </View>

      <Text style={styles.subjectTitle} numberOfLines={2}>
        {slot.subject_name}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Icon name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {slot.teacher_name}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {slot.classroom_name}
          </Text>
        </View>
      </View>

      {isCurrent && onPressCheckIn && (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => onPressCheckIn(slot)}
          activeOpacity={0.85}>
          <Icon name="radio" size={16} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.checkInButtonText}>Check In Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  cardDefault: {
    borderColor: COLORS.border,
  },
  cardActive: {
    borderColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardNext: {
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  nextBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    maxWidth: '45%',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
