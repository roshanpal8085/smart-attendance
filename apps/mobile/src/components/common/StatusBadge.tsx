import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../utils/constants';

export type BadgeStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'verifying'
  | 'active'
  | 'completed'
  | 'eligible'
  | 'not_eligible';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
}) => {
  const normalized = status.toLowerCase() as BadgeStatus;

  let backgroundColor = '#f1f5f9';
  let textColor = COLORS.textSecondary;
  let iconName = 'ellipse';

  switch (normalized) {
    case 'present':
    case 'eligible':
      backgroundColor = '#dcfce7'; // green 100
      textColor = COLORS.success;
      iconName = 'checkmark-circle';
      break;
    case 'absent':
    case 'not_eligible':
      backgroundColor = '#fee2e2'; // red 100
      textColor = COLORS.error;
      iconName = 'close-circle';
      break;
    case 'late':
    case 'verifying':
      backgroundColor = '#fef3c7'; // amber 100
      textColor = COLORS.warning;
      iconName = 'time';
      break;
    case 'active':
      backgroundColor = '#dbeafe'; // blue 100
      textColor = COLORS.primaryLight;
      iconName = 'radio-button-on';
      break;
    case 'completed':
    case 'excused':
      backgroundColor = '#f1f5f9';
      textColor = COLORS.textSecondary;
      iconName = 'checkmark-done';
      break;
    default:
      backgroundColor = '#f1f5f9';
      textColor = COLORS.textSecondary;
      iconName = 'information-circle';
      break;
  }

  const displayText = label || normalized.toUpperCase();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {backgroundColor},
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}>
      <Icon
        name={iconName}
        size={isSmall ? 12 : 14}
        color={textColor}
        style={styles.badgeIcon}
      />
      <Text
        style={[
          styles.badgeText,
          {color: textColor},
          isSmall ? styles.textSmall : styles.textMedium,
        ]}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeMedium: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
