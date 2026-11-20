import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../../utils/constants';

interface AttendanceBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
  minThreshold?: number; // e.g., 75% requirement
}

export const AttendanceBar: React.FC<AttendanceBarProps> = ({
  percentage,
  height = 10,
  showLabel = true,
  minThreshold = 75,
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  let fillColor = COLORS.success;
  if (clampedPercentage < 65) {
    fillColor = COLORS.error;
  } else if (clampedPercentage < minThreshold) {
    fillColor = COLORS.warning;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.percentageText}>{clampedPercentage.toFixed(1)}%</Text>
          <Text style={styles.thresholdText}>Min Required: {minThreshold}%</Text>
        </View>
      )}

      <View style={[styles.barBackground, {height}]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${clampedPercentage}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
        {/* Min threshold indicator mark */}
        <View
          style={[
            styles.thresholdLine,
            {
              left: `${minThreshold}%`,
              height: height + 4,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  thresholdText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  barBackground: {
    width: '100%',
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  thresholdLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: COLORS.textSecondary,
    top: -2,
    zIndex: 2,
  },
});
