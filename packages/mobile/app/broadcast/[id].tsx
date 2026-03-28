import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../services/api';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  urgency: string;
  dateNeeded: string;
  department: string;
  description?: string;
}

export default function BroadcastDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadBroadcast();
  }, [id]);

  const loadBroadcast = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch the specific broadcast
      // For now, using mock data
      const allBroadcasts = await api.getMyBroadcasts();
      const found = allBroadcasts.find((b) => b.id === id);
      if (found) {
        setBroadcast(found);
      }
    } catch (err) {
      console.log('Error loading broadcast:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (
    response: 'ACCEPTED' | 'TENTATIVE' | 'DECLINED'
  ) => {
    setResponding(true);
    try {
      await api.respondToBroadcast(id as string, response);
      Alert.alert('Success', `You have ${response.toLowerCase()} this broadcast`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to respond');
    } finally {
      setResponding(false);
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

  if (!broadcast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Broadcast</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Broadcast not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const urgencyColor =
    broadcast.urgency === 'HIGH'
      ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
      : broadcast.urgency === 'MEDIUM'
      ? { backgroundColor: '#FEF3C7', color: '#D97706' }
      : { backgroundColor: '#DBEAFE', color: '#1E40AF' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Broadcast</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Title and Urgency */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{broadcast.title}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor.backgroundColor }]}>
              <Text style={[styles.urgencyText, { color: urgencyColor.color }]}>
                {broadcast.urgency} PRIORITY
              </Text>
            </View>
          </View>

          {/* Details Cards */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{broadcast.department}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Date Needed</Text>
              <Text style={styles.detailValue}>{broadcast.dateNeeded}</Text>
            </View>
          </View>

          {/* Message/Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                {broadcast.description || broadcast.message}
              </Text>
            </View>
          </View>

          {/* Response Buttons */}
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>What can you do?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.responseButton, styles.acceptButton, responding && styles.buttonDisabled]}
                onPress={() => handleResponse('ACCEPTED')}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#ffffff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.responseButton, styles.tentativeButton, responding && styles.buttonDisabled]}
                onPress={() => handleResponse('TENTATIVE')}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator color="#92400E" />
                ) : (
                  <>
                    <Ionicons
                      name="help-circle"
                      size={20}
                      color="#92400E"
                      style={styles.buttonIcon}
                    />
                    <Text style={[styles.buttonText, { color: '#92400E' }]}>
                      Tentative
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.responseButton, styles.declineButton, responding && styles.buttonDisabled]}
                onPress={() => handleResponse('DECLINED')}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="#ffffff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
  messageBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  actionSection: {
    marginTop: 32,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  buttonGroup: {
    gap: 12,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  tentativeButton: {
    backgroundColor: '#FCD34D',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
