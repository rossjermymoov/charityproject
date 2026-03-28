import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { useRouter } from 'expo-router';
import * as api from '../../services/api';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  skills?: string[];
  availability?: { day: string; available: boolean }[];
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState({
    broadcasts: true,
    reminders: true,
    hourUpdates: true,
  });
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyProfile();
      setProfile(data);
    } catch (err) {
      console.log('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/(auth)/login');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>

        {/* Skills Section */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Availability Section */}
        {profile?.availability && profile.availability.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityContainer}>
              {profile.availability.map((item, index) => (
                <View key={index} style={styles.availabilityItem}>
                  <Text style={styles.dayText}>{item.day}</Text>
                  <View
                    style={[
                      styles.availabilityBadge,
                      {
                        backgroundColor: item.available ? '#DCFCE7' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityText,
                        { color: item.available ? '#166534' : '#DC2626' },
                      ]}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationItem}>
              <View style={styles.notificationLabel}>
                <Text style={styles.notificationTitle}>Broadcasts</Text>
                <Text style={styles.notificationDesc}>
                  Get alerts for new broadcasts
                </Text>
              </View>
              <Switch
                value={notifications.broadcasts}
                onValueChange={() => toggleNotification('broadcasts')}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={notifications.broadcasts ? '#4F46E5' : '#F3F4F6'}
              />
            </View>

            <View style={styles.notificationDivider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationLabel}>
                <Text style={styles.notificationTitle}>Reminders</Text>
                <Text style={styles.notificationDesc}>
                  Reminders for upcoming assignments
                </Text>
              </View>
              <Switch
                value={notifications.reminders}
                onValueChange={() => toggleNotification('reminders')}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={notifications.reminders ? '#4F46E5' : '#F3F4F6'}
              />
            </View>

            <View style={styles.notificationDivider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationLabel}>
                <Text style={styles.notificationTitle}>Hour Updates</Text>
                <Text style={styles.notificationDesc}>
                  Updates on logged hour approvals
                </Text>
              </View>
              <Switch
                value={notifications.hourUpdates}
                onValueChange={() => toggleNotification('hourUpdates')}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={notifications.hourUpdates ? '#4F46E5' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E40AF',
  },
  availabilityContainer: {
    gap: 12,
  },
  availabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notificationLabel: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  notificationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
