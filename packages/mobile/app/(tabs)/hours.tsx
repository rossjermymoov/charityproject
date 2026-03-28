import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../services/api';

interface HourLog {
  id: string;
  date: string;
  hours: number;
  department: string;
  status: string;
}

export default function HoursScreen() {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [hoursLog, setHoursLog] = useState<HourLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyHours();
      const sorted = data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHoursLog(sorted);
    } catch (err) {
      console.log('Error loading hours:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHours();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!date || !hours || !department) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.logHours({
        date,
        hours: parseFloat(hours),
        department,
        description,
      });

      setDate('');
      setHours('');
      setDepartment('');
      setDescription('');

      await loadHours();
      Alert.alert('Success', 'Hours logged successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log hours');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'APPROVED':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'REJECTED':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const renderHourLog = ({ item }: { item: HourLog }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.logInfo}>
            <Text style={styles.logDate}>{item.date}</Text>
            <Text style={styles.logDepartment}>{item.department}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusColor.color }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.logHours}>{item.hours} hours</Text>
      </View>
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
        <Text style={styles.headerTitle}>Log Hours</Text>
      </View>

      <FlatList
        data={hoursLog}
        keyExtractor={(item) => item.id}
        renderItem={renderHourLog}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Log Your Hours</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-03-28"
                  placeholderTextColor="#9CA3AF"
                  value={date}
                  onChangeText={setDate}
                  editable={!submitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hours</Text>
                <TextInput
                  style={styles.input}
                  placeholder="8"
                  placeholderTextColor="#9CA3AF"
                  value={hours}
                  onChangeText={setHours}
                  editable={!submitting}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Food Distribution"
                  placeholderTextColor="#9CA3AF"
                  value={department}
                  onChangeText={setDepartment}
                  editable={!submitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What did you work on?"
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  editable={!submitting}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Log Hours</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.recentTitle}>Recent Hours</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hours logged yet</Text>
          </View>
        }
      />
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
    paddingBottom: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 20,
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  logDepartment: {
    fontSize: 13,
    color: '#6B7280',
  },
  logHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 8,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
