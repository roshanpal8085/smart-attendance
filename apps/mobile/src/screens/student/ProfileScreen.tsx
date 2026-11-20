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
import {useBiometric} from '../../hooks/useBiometric';
import {studentApi} from '../../services/studentApi';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {COLORS} from '../../utils/constants';
import type {StudentTabScreenProps} from '../../types/navigation';
import type {StudentProfile} from '../../types/api';

export const StudentProfileScreen: React.FC<
  StudentTabScreenProps<'ProfileTab'>
> = () => {
  const {user, logout, isLoggingOut} = useAuth();
  const {isAvailable, biometryType} = useBiometric();

  const {data: studentProfile, isLoading} = useQuery<StudentProfile>({
    queryKey: ['studentProfile'],
    queryFn: studentApi.getProfile,
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
    return <LoadingSpinner fullScreen message="Loading student profile..." />;
  }

  const profile = studentProfile || (user as any);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.first_name?.charAt(0) || 'S'}
            {user?.last_name?.charAt(0) || ''}
          </Text>
        </View>

        <Text style={styles.fullName}>
          {user ? `${user.first_name} ${user.last_name}` : 'Student'}
        </Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>STUDENT</Text>
        </View>
      </View>

      {/* Academic Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Roll Number</Text>
          <Text style={styles.infoValue}>{profile?.roll_number || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{profile?.department || 'Computer Science'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Semester</Text>
          <Text style={styles.infoValue}>{profile?.semester ? `Semester ${profile.semester}` : 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Batch Year</Text>
          <Text style={styles.infoValue}>{profile?.batch_year || '2024'}</Text>
        </View>
      </View>

      {/* Security & Verification Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Security & Biometrics</Text>

        <View style={styles.securityRow}>
          <View style={styles.securityLeft}>
            <Icon
              name={isAvailable ? 'shield-checkmark' : 'alert-circle'}
              size={20}
              color={isAvailable ? COLORS.success : COLORS.warning}
            />
            <View style={styles.securityTextGroup}>
              <Text style={styles.securityTitle}>{biometryType}</Text>
              <Text style={styles.securitySub}>
                {isAvailable ? 'Enrolled & Verified' : 'Sensor not available'}
              </Text>
            </View>
          </View>
          <Icon
            name={isAvailable ? 'checkmark' : 'close'}
            size={18}
            color={isAvailable ? COLORS.success : COLORS.error}
          />
        </View>
      </View>

      {/* Sign Out Button */}
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
    backgroundColor: COLORS.primary,
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
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityTextGroup: {
    marginLeft: 10,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  securitySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
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
