import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import * as api from '../../services/api';
import { useRouter } from 'expo-router';

interface Assignment {
  id: string;
  title: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Broadcast {
  id: string;
  title: string;
  urgency: string;
  dateNeeded: string;
  department: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assignmentsData, broadcastsData] = await Promise.all([
        api.getMyAssignments(),
        api.getMyBroadcasts(),
      ]);

      setAssignments(assignmentsData.slice(0, 5));
      setBroadcasts(broadcastsData);
    } catch (err) {
      console.log('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.name?.split(' ')[0]}!
          </Text>
          <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
        </View>

        {/* Upcoming Assignments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
          {assignments.length > 0 ? (
            <View style={styles.itemList}>
              {assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.assignmentCard}
                  onPress={() =>
                    router.push(`/assignment/${assignment.id}`)
                  }
                >
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>
                      {assignment.title}
                    </Text>
                    <Text style={styles.departmentBadge}>
                      {assignment.department}
                    </Text>
                  </View>
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.detailText}>
                      {assignment.date} • {assignment.startTime}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming assignments</Text>
            </View>
          )}
        </View>

        {/* Active Broadcasts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Broadcasts</Text>
          {broadcasts.length > 0 ? (
            <View style={styles.itemList}>
              {broadcasts.map((broadcast) => (
                <TouchableOpacity
                  key={broadcast.id}
                  style={styles.broadcastCard}
                  onPress={() =>
                    router.push(`/broadcast/${broadcast.id}`)
                  }
                >
                  <View style={styles.broadcastHeader}>
                    <Text style={styles.broadcastTitle}>
                      {broadcast.title}
                    </Text>
                    <View
                      style={[
                        styles.urgencyBadge,
                        {
                          backgroundColor:
                            broadcast.urgency === 'HIGH'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          {
                            color:
                              broadcast.urgency === 'HIGH'
                                ? '#DC2626'
                                : '#D97706',
                          },
                        ]}
                      >
                        {broadcast.urgency}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.broadcastDetails}>
                    <Text style={styles.detailText}>
                      {broadcast.department} • {broadcast.dateNeeded}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active broadcasts</Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
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
  itemList: {
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  departmentBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  assignmentDetails: {
    marginTop: 8,
  },
  broadcastCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  broadcastDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
