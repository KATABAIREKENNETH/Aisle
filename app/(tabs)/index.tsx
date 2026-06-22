import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useWeddingStore } from '../../store/weddingStore';
import { useTaskStore } from '../../store/taskStore';
import { useBudgetStore } from '../../store/budgetStore';
import { getDaysUntil } from '../../lib/utils/date';
import { formatCurrency } from '../../lib/utils/currency';
import { theme } from '../../config/theme';
import { usePerformanceTracking } from '../../lib/hooks/usePerformanceTracking';

export default function DashboardScreen() {
  const { wedding } = useWeddingStore();
  const { tasks } = useTaskStore();
  const { categories, expenses } = useBudgetStore();
  
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  // Track screen load performance
  usePerformanceTracking('dashboard');

  useEffect(() => {
    if (wedding?.wedding_date) {
      setDaysRemaining(getDaysUntil(wedding.wedding_date));
    }
  }, [wedding]);

  useEffect(() => {
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      setProgress(Math.round((completedTasks / tasks.length) * 100));
    }
  }, [tasks]);

  const totalBudget = wedding?.budget || 0;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = totalBudget - totalSpent;

  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate.toDateString() === today.toDateString() && task.status !== 'completed';
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.subtitle}>
            {wedding ? `Your wedding is in ${daysRemaining} days` : 'Set up your wedding'}
          </Text>
        </View>
        <Pressable style={styles.avatar} onPress={() => router.replace('/profile')}>
          <Ionicons name="person" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Countdown Card */}
      <View style={styles.countdownCard}>
        <Text style={styles.countdownLabel}>Days Until Wedding</Text>
        <Text style={styles.countdownNumber}>{daysRemaining}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% Complete</Text>
      </View>

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
        <Pressable style={styles.quickActionButton} onPress={() => router.replace('/tasks')}>
          <Ionicons name="add-circle" size={32} color={theme.text} />
          <Text style={styles.quickActionText}>Task</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => router.replace('/photos')}>
          <Ionicons name="images" size={32} color={theme.text} />
          <Text style={styles.quickActionText}>Gallery</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => router.replace('/notifications')}>
          <Ionicons name="chatbubble" size={32} color={theme.text} />
          <Text style={styles.quickActionText}>Message</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => router.replace('/dayof')}>
          <Ionicons name="calendar" size={32} color={theme.text} />
          <Text style={styles.quickActionText}>Schedule</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => router.replace('/rsvp-links')}>
          <Ionicons name="list" size={32} color={theme.text} />
          <Text style={styles.quickActionText}>RSVPs</Text>
        </Pressable>
      </ScrollView>

      {/* Budget Snapshot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <Pressable style={styles.budgetCard} onPress={() => router.replace('/budget')}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Spent</Text>
            <Text style={styles.budgetValueSpent}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Remaining</Text>
            <Text style={styles.budgetValueRemaining}>{formatCurrency(remainingBudget)}</Text>
          </View>
        </Pressable>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Pressable onPress={() => router.replace('/tasks')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        {todayTasks.length > 0 ? (
          todayTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={[styles.taskCheckbox, task.status === 'completed' && styles.taskCheckboxCompleted]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskDue}>Due today</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textDisabled} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No tasks due today</Text>
        )}
      </View>

      {/* Photo Gallery Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Memories</Text>
          <Pressable onPress={() => router.replace('/photos')}>
            <Text style={styles.seeAll}>Open Gallery</Text>
          </Pressable>
        </View>
        <Pressable style={styles.galleryPreviewCard} onPress={() => router.replace('/photos')}>
          <Ionicons name="images-outline" size={48} color={theme.textDisabled} />
          <Text style={styles.emptyText}>Upload your first memory</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    fontFamily: theme.typography.heading.fontFamily,
    color: theme.text,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCard: {
    margin: 24,
    padding: 24,
    backgroundColor: theme.surface,
    borderRadius: 16,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.success,
  },
  progressText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingRight: 48,
    marginBottom: 32,
    gap: 32,
  },
  quickActionButton: {
    alignItems: 'center',
    width: 64,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    color: theme.text,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  budgetCard: {
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 12,
    padding: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  budgetValueSpent: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.success,
  },
  budgetValueRemaining: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.info,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.text,
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textDisabled,
  },
  taskDue: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
    marginLeft: 12,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textDisabled,
    textAlign: 'center',
    paddingVertical: 16,
  },
  galleryPreviewCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
  },
});
