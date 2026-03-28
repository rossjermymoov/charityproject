import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../services/api';

interface Assignment {
  id: string;
  title: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  location?: string;
}

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch the specific assignment
      // For now, using mock data
      const allAssignments = await api.getMyAssignments();
      const found = allAssignments.find((a) => a.id === id);
      if (found) {
        setAssignment(found);
      }
    } catch (err) {
      console.log('Error loading assignment:', err);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assignment</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Assignment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(assignment.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Title and Status */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{assignment.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor.backgroundColor },
              ]}
            >
              <Text
                style={[styles.statusText, { color: statusColor.color }]}
              >
                {assignment.status}
              </Text>
            </View>
          </View>

          {/* Key Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <Ionicons name="business" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{assignment.department}</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{assignment.date}</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {assignment.startTime} - {assignment.endTime}
              </Text>
            </View>

            {assignment.location && (
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{assignment.location}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {assignment.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {assignment.description}
                </Text>
              </View>
            </View>
          )}

          {/* Info Cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" />
              <Text style={styles.infoText}>
                Please arrive 10 minutes early to the location
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons
                name="checkmark-done-circle"
                size={20}
                color="#10B981"
              />
              <Text style={styles.infoText}>
                Log your hours after completion
              </Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  detailCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  descriptionBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
