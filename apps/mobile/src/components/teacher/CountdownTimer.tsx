import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {getRemainingSeconds, formatSecondsToMinutes} from '../../utils/dateUtils';
import {COLORS} from '../../utils/constants';

interface CountdownTimerProps {
  expiresAt: string; // ISO 8601 string from backend
  onExpire?: () => void;
  size?: 'normal' | 'large';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  size = 'large',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    getRemainingSeconds(expiresAt),
  );
  const onExpireCalledRef = useRef(false);

  useEffect(() => {
    // Reset expiration flag if expiresAt changes
    onExpireCalledRef.current = false;

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(expiresAt);
      setSecondsRemaining(remaining);

      if (remaining <= 0 && !onExpireCalledRef.current) {
        onExpireCalledRef.current = true;
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = secondsRemaining < 30 && secondsRemaining > 0;
  const isExpired = secondsRemaining <= 0;

  let timerColor = COLORS.primary;
  let bgBadgeColor = '#eff6ff';

  if (isExpired) {
    timerColor = COLORS.error;
    bgBadgeColor = '#fee2e2';
  } else if (isUrgent) {
    timerColor = COLORS.warning;
    bgBadgeColor = '#fef3c7';
  }

  const isLarge = size === 'large';

  return (
    <View style={[styles.container, {backgroundColor: bgBadgeColor}]}>
      <Icon
        name={isExpired ? 'stopwatch' : 'time-outline'}
        size={isLarge ? 22 : 16}
        color={timerColor}
        style={styles.timerIcon}
      />
      <View>
        <Text
          style={[
            styles.timerValue,
            {color: timerColor},
            isLarge ? styles.largeText : styles.normalText,
          ]}>
          {isExpired ? '00:00 - Session Expired' : formatSecondsToMinutes(secondsRemaining)}
        </Text>
        {!isExpired && (
          <Text style={styles.captionText}>Remaining Session Window</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 8,
  },
  timerIcon: {
    marginRight: 10,
  },
  timerValue: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  largeText: {
    fontSize: 24,
  },
  normalText: {
    fontSize: 16,
  },
  captionText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
