import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../services/api';
import { useRouter } from 'expo-router';

interface Assignment {
  id: string;
  title: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export default function ScheduleScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyAssignments();
      const sorted = data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setAssignments(sorted);
    } catch (err) {
      console.log('Error loading assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'CONFIRMED':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'COMPLETED':
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      case 'CANCELLED':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.assignmentCard}
        onPress={() => router.push(`/assignment/${item.id}`)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.department}>{item.department}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.backgroundColor }]}
            >
              <Text style={[styles.statusText, { color: statusColor.color }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>
              {item.date}
            </Text>
            <Text style={styles.detailText}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {assignments.length > 0 ? (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignment}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No assignments scheduled</Text>
        </View>
      )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  department: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
