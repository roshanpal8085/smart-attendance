import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../utils/constants';
import {formatDurationHuman} from '../../utils/dateUtils';
import type {ProximityState} from '../../types/ble';

interface ProximityStatusCardProps {
  proximityState: ProximityState;
  signalStrength: number | null;
  presenceWindowSeconds: number;
  requiredSeconds?: number;
  classroomName?: string;
  onRequestPermissions?: () => void;
}

export const ProximityStatusCard: React.FC<ProximityStatusCardProps> = ({
  proximityState,
  signalStrength,
  presenceWindowSeconds,
  requiredSeconds = 900,
  classroomName,
  onRequestPermissions,
}) => {
  let title = 'Searching for classroom...';
  let subtitle = 'Make sure Bluetooth is enabled and you are inside the classroom.';
  let iconName = 'radio-outline';
  let statusColor = COLORS.primaryLight;
  let bgTint = '#eff6ff';

  switch (proximityState) {
    case 'searching':
      title = 'Searching for classroom...';
      subtitle = classroomName
        ? `Locating BLE beacon in ${classroomName}...`
        : 'Scanning for classroom Bluetooth beacon...';
      iconName = 'search';
      statusColor = COLORS.primaryLight;
      bgTint = '#eff6ff';
      break;

    case 'detected':
      title = 'Classroom Detected';
      subtitle = 'Beacon verified in range. Commencing presence verification.';
      iconName = 'checkmark-circle-outline';
      statusColor = COLORS.success;
      bgTint = '#f0fdf4';
      break;

    case 'verifying':
      title = 'Verifying Presence...';
      subtitle = `Continuously verifying classroom dwell time. Need ${formatDurationHuman(
        requiredSeconds,
      )}.`;
      iconName = 'hourglass-outline';
      statusColor = COLORS.warning;
      bgTint = '#fffbeb';
      break;

    case 'eligible':
      title = 'Eligible for Attendance';
      subtitle = `Continuous presence verified (${formatDurationHuman(
        presenceWindowSeconds,
      )}). Ready to mark.`;
      iconName = 'shield-checkmark';
      statusColor = COLORS.success;
      bgTint = '#f0fdf4';
      break;

    case 'not_eligible':
      title = 'Not Eligible Yet';
      subtitle = `Required continuous presence (${formatDurationHuman(
        requiredSeconds,
      )}) not yet fulfilled.`;
      iconName = 'close-circle-outline';
      statusColor = COLORS.error;
      bgTint = '#fef2f2';
      break;

    case 'signal_lost':
      title = 'Signal Lost';
      subtitle = 'Cannot detect classroom beacon. Return inside classroom range.';
      iconName = 'alert-circle';
      statusColor = COLORS.error;
      bgTint = '#fef2f2';
      break;

    case 'disabled':
      title = 'Bluetooth Disabled';
      subtitle = 'Please turn on Bluetooth in your device settings to verify presence.';
      iconName = 'bluetooth';
      statusColor = '#475569';
      bgTint = '#f1f5f9';
      break;

    case 'permission_required':
      title = 'Permission Required';
      subtitle = 'Bluetooth & Nearby Devices permissions are needed for attendance.';
      iconName = 'warning-outline';
      statusColor = COLORS.warning;
      bgTint = '#fffbeb';
      break;

    case 'unsupported':
      title = 'BLE Unsupported';
      subtitle = 'Bluetooth Low Energy is not supported on this device hardware.';
      iconName = 'hardware-chip-outline';
      statusColor = '#475569';
      bgTint = '#f1f5f9';
      break;
  }

  // Calculate RSSI Signal Strength Bars (0 to 4 bars)
  let signalBars = 0;
  if (signalStrength !== null) {
    if (signalStrength >= -60) signalBars = 4;
    else if (signalStrength >= -70) signalBars = 3;
    else if (signalStrength >= -80) signalBars = 2;
    else signalBars = 1;
  }

  return (
    <View style={[styles.card, {borderColor: statusColor}]}>
      <View style={[styles.iconContainer, {backgroundColor: bgTint}]}>
        <Icon name={iconName} size={42} color={statusColor} />
      </View>

      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateSubtitle}>{subtitle}</Text>

      {/* Signal Strength & Presence Metrics */}
      <View style={styles.metricsBox}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Signal (RSSI)</Text>
          <View style={styles.signalRow}>
            <View style={styles.signalBarsContainer}>
              <View
                style={[
                  styles.bar,
                  styles.bar1,
                  signalBars >= 1 && {backgroundColor: statusColor},
                ]}
              />
              <View
                style={[
                  styles.bar,
                  styles.bar2,
                  signalBars >= 2 && {backgroundColor: statusColor},
                ]}
              />
              <View
                style={[
                  styles.bar,
                  styles.bar3,
                  signalBars >= 3 && {backgroundColor: statusColor},
                ]}
              />
              <View
                style={[
                  styles.bar,
                  styles.bar4,
                  signalBars >= 4 && {backgroundColor: statusColor},
                ]}
              />
            </View>
            <Text style={styles.metricValue}>
              {signalStrength !== null ? `${signalStrength} dBm` : 'No Signal'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Verified Presence</Text>
          <Text style={[styles.metricValue, {color: statusColor}]}>
            {formatDurationHuman(presenceWindowSeconds)}
          </Text>
        </View>
      </View>

      {proximityState === 'permission_required' && onRequestPermissions && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={onRequestPermissions}
          activeOpacity={0.8}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    marginVertical: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  metricsBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
    height: 14,
  },
  bar: {
    width: 3,
    marginRight: 2,
    backgroundColor: '#cbd5e1',
    borderRadius: 1.5,
  },
  bar1: {height: 4},
  bar2: {height: 7},
  bar3: {height: 10},
  bar4: {height: 14},
  permissionButton: {
    marginTop: 16,
    backgroundColor: COLORS.warning,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
