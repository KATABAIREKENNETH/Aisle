import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWeddingStore } from '../../store/weddingStore';
import { useTaskStore } from '../../store/taskStore';
import { useVendorStore } from '../../store/vendorStore';
import { theme as appTheme } from '../../config/theme';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  completed: boolean;
  type: 'ceremony' | 'reception' | 'dinner' | 'speech' | 'dance' | 'custom';
}

export default function DayOfScreen() {
  const { wedding } = useWeddingStore();
  const { tasks } = useTaskStore();
  const { vendors } = useVendorStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: '1', time: '10:00 AM', title: 'Ceremony Begins', completed: false, type: 'ceremony' },
    { id: '2', time: '11:00 AM', title: 'Cocktail Hour', completed: false, type: 'reception' },
    { id: '3', time: '12:00 PM', title: 'Lunch Service', completed: false, type: 'dinner' },
    { id: '4', time: '1:00 PM', title: 'Speeches', completed: false, type: 'speech' },
    { id: '5', time: '2:00 PM', title: 'First Dance', completed: false, type: 'dance' },
    { id: '6', time: '3:00 PM', title: 'Cake Cutting', completed: false, type: 'custom' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCallVendor = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleToggleEvent = (id: string) => {
    setTimeline(timeline.map(event =>
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
  };

  const urgentTasks = tasks.filter(t => 
    t.status === 'pending' && 
    t.due_date && 
    new Date(t.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'ceremony': return 'heart';
      case 'reception': return 'wine';
      case 'dinner': return 'restaurant';
      case 'speech': return 'mic';
      case 'dance': return 'musical-notes';
      default: return 'calendar';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'ceremony': return '#FF6B6B';
      case 'reception': return '#4ECDC4';
      case 'dinner': return '#FFA726';
      case 'speech': return '#9C27B0';
      case 'dance': return '#FF4081';
      default: return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Countdown */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Day Of</Text>
        <Text style={styles.headerSubtitle}>
          {wedding?.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }) : 'Wedding Day'}
        </Text>
        <View style={styles.countdownContainer}>
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>
              {wedding?.wedding_date ? Math.max(0, Math.ceil((new Date(wedding.wedding_date).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24))) : 0}
            </Text>
            <Text style={styles.countdownLabel}>Days</Text>
          </View>
          <View style={styles.countdownDivider} />
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>
              {currentTime.getHours().toString().padStart(2, '0')}
            </Text>
            <Text style={styles.countdownLabel}>Hours</Text>
          </View>
          <View style={styles.countdownDivider} />
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>
              {currentTime.getMinutes().toString().padStart(2, '0')}
            </Text>
            <Text style={styles.countdownLabel}>Mins</Text>
          </View>
          <View style={styles.countdownDivider} />
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>
              {currentTime.getSeconds().toString().padStart(2, '0')}
            </Text>
            <Text style={styles.countdownLabel}>Secs</Text>
          </View>
        </View>
      </View>

      {/* Live Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Timeline</Text>
          <Pressable style={styles.editButton}>
            <Ionicons name="create" size={16} color={appTheme.textSecondary} />
          </Pressable>
        </View>
        
        {timeline.map((event, index) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineTime}>
                <Text style={styles.timelineTimeText}>{event.time}</Text>
              </View>
              {index < timeline.length - 1 && <View style={styles.timelineLine} />}
            </View>
            
            <Pressable
              style={[
                styles.timelineCard,
                event.completed && styles.timelineCardCompleted
              ]}
              onPress={() => handleToggleEvent(event.id)}
            >
              <View style={[styles.timelineIcon, { backgroundColor: getEventTypeColor(event.type) + '20' }]}>
                <Ionicons name={getEventTypeIcon(event.type) as any} size={20} color={getEventTypeColor(event.type)} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, event.completed && styles.timelineTitleCompleted]}>
                  {event.title}
                </Text>
                <Text style={styles.timelineStatus}>
                  {event.completed ? 'Completed' : 'Upcoming'}
                </Text>
              </View>
              {event.completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={16} color={appTheme.text} />
                </View>
              )}
            </Pressable>
          </View>
        ))}
      </View>

      {/* Vendor Quick Dial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendor Quick Dial</Text>
        
        {vendors.length > 0 ? (
          vendors.map((vendor) => (
            <View key={vendor.id} style={styles.vendorCard}>
              <View style={styles.vendorInfo}>
                <View style={styles.vendorAvatar}>
                  <Text style={styles.vendorAvatarText}>
                    {vendor.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.vendorDetails}>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.vendorCategory}>{vendor.category}</Text>
                  {vendor.phone && (
                    <Text style={styles.vendorPhone}>{vendor.phone}</Text>
                  )}
                </View>
              </View>
              {vendor.phone && (
                <Pressable
                  style={styles.callButton}
                  onPress={() => handleCallVendor(vendor.phone || '')}
                >
                  <Ionicons name="call" size={20} color={appTheme.text} />
                </Pressable>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase" size={48} color={appTheme.textDisabled} />
            <Text style={styles.emptyText}>No vendors added yet</Text>
          </View>
        )}
      </View>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgent Tasks</Text>
          
          {urgentTasks.map((task) => (
            <View key={task.id} style={styles.urgentTaskCard}>
              <View style={styles.urgentTaskIcon}>
                <Ionicons name="alert-circle" size={20} color={appTheme.error} />
              </View>
              <View style={styles.urgentTaskContent}>
                <Text style={styles.urgentTaskTitle}>{task.title}</Text>
                <Text style={styles.urgentTaskDue}>
                  Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'TBD'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickActionsGrid}>
          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="megaphone" size={24} color={appTheme.text} />
            <Text style={styles.quickActionText}>Make Announcement</Text>
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/guests')}>
            <Ionicons name="people" size={24} color={appTheme.text} />
            <Text style={styles.quickActionText}>Check Guests</Text>
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/tasks')}>
            <Ionicons name="list" size={24} color={appTheme.text} />
            <Text style={styles.quickActionText}>View Checklist</Text>
          </Pressable>

          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/photos')}>
            <Ionicons name="camera" size={24} color={appTheme.text} />
            <Text style={styles.quickActionText}>Take Photos</Text>
          </Pressable>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        
        <Pressable style={styles.emergencyCard}>
          <Ionicons name="call" size={24} color={appTheme.error} />
          <Text style={styles.emergencyText}>Emergency Services</Text>
          <Text style={styles.emergencyNumber}>911</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: appTheme.surface,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: appTheme.textDisabled,
    marginBottom: 24,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  countdownLabel: {
    fontSize: 12,
    color: appTheme.textDisabled,
    textTransform: 'uppercase',
  },
  countdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: appTheme.colors.surface.overlay,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 16,
  },
  editButton: {
    padding: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineTime: {
    backgroundColor: appTheme.colors.surface.raised,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.textSecondary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: appTheme.colors.border.default,
    marginTop: 8,
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border.default,
    borderRadius: 12,
    padding: 12,
  },
  timelineCardCompleted: {
    backgroundColor: appTheme.colors.surface.raised,
    opacity: 0.7,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  timelineTitleCompleted: {
    textDecorationLine: 'line-through',
    color: appTheme.textDisabled,
  },
  timelineStatus: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: appTheme.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vendorAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginBottom: 4,
  },
  vendorPhone: {
    fontSize: 12,
    color: appTheme.textDisabled,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appTheme.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    marginTop: 12,
  },
  urgentTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.overlay,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  urgentTaskIcon: {
    marginRight: 12,
  },
  urgentTaskContent: {
    flex: 1,
  },
  urgentTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  urgentTaskDue: {
    fontSize: 12,
    color: appTheme.error,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.text,
    textAlign: 'center',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appTheme.colors.surface.overlay,
    padding: 16,
    borderRadius: 12,
  },
  emergencyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginLeft: 12,
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.error,
  },
});
