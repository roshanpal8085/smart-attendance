import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../hooks/useAuth';
import {teacherApi} from '../../services/teacherApi';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {COLORS} from '../../utils/constants';
import type {TeacherTabScreenProps} from '../../types/navigation';
import type {TeacherProfile} from '../../types/api';

export const TeacherProfileScreen: React.FC<
  TeacherTabScreenProps<'ProfileTab'>
> = () => {
  const {user, logout, isLoggingOut} = useAuth();

  const {data: teacherProfile, isLoading} = useQuery<TeacherProfile>({
    queryKey: ['teacherProfile'],
    queryFn: teacherApi.getProfile,
  });

  const handleLogout = () => {
    Alert.alert('Confirm Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading faculty profile..." />;
  }

  const profile = teacherProfile || (user as any);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.first_name?.charAt(0) || 'T'}
            {user?.last_name?.charAt(0) || ''}
          </Text>
        </View>

        <Text style={styles.fullName}>
          {user ? `Prof. ${user.first_name} ${user.last_name}` : 'Faculty Member'}
        </Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>FACULTY / INSTRUCTOR</Text>
        </View>
      </View>

      {/* Professional Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Faculty Profile</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Code</Text>
          <Text style={styles.infoValue}>{profile?.employee_code || 'FAC-1029'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{profile?.department || 'Computer Science & Engineering'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Designation</Text>
          <Text style={styles.infoValue}>{profile?.designation || 'Assistant Professor'}</Text>
        </View>
      </View>

      {/* BLE Capabilities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Classroom Broadcast Capabilities</Text>

        <View style={styles.bleRow}>
          <Icon name="bluetooth" size={20} color={COLORS.primary} />
          <View style={styles.bleTextGroup}>
            <Text style={styles.bleTitle}>BLE Peripheral Advertising</Text>
            <Text style={styles.bleSub}>
              Supported hardware mode for classrooms lacking fixed beacons.
            </Text>
          </View>
          <Icon name="checkmark-circle" size={18} color={COLORS.success} />
        </View>
      </View>

      {/* Sign Out CTA */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.85}>
        <Icon name="log-out-outline" size={20} color={COLORS.error} style={styles.logoutIcon} />
        <Text style={styles.logoutButtonText}>
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  bleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bleTextGroup: {
    marginLeft: 10,
    flex: 1,
  },
  bleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
