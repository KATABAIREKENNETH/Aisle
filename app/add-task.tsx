import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../store/taskStore';
import { useWeddingStore } from '../store/weddingStore';
import { createTask } from '../lib/api/tasks';
import type { TaskPriority } from '../types';
import { theme } from '../config/theme';
import CustomDatePicker from '../components/CustomDatePicker';

const CATEGORIES = ['venue', 'catering', 'attire', 'photography', 'florist', 'music', 'other'];
const PRIORITIES = [
  { id: 'low', label: 'Low', color: theme.success },
  { id: 'medium', label: 'Medium', color: theme.warning },
  { id: 'high', label: 'High', color: theme.error },
];

const safeClose = (fallback: string) => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
};

export default function AddTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('venue');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const { addTask } = useTaskStore();
  const { wedding } = useWeddingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title to continue.');
      return;
    }

    if (!wedding?.id) {
      Alert.alert('Setup Required', 'Please complete your wedding setup first before adding tasks.');
      return;
    }

    try {
      setIsSubmitting(true);
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        due_date: dueDate || undefined,
        priority: priority as TaskPriority,
        status: 'pending' as const,
        assigned_to: undefined,
      };

      const newTask = await createTask(wedding.id, taskData);
      addTask(newTask);
      safeClose('/tasks');
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error?.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => safeClose('/tasks')} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Task</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isSubmitting}>
            <Text style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Book the venue"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={theme.textDisabled}
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add some details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor={theme.textDisabled}
              textAlignVertical="top"
            />
          </View>

          {/* Due Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <CustomDatePicker date={dueDate} onDateChange={setDueDate} />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipSelected]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.priorityBtn,
                    priority === p.id && { backgroundColor: p.color + '22', borderColor: p.color },
                  ]}
                  onPress={() => setPriority(p.id)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[
                    styles.priorityBtnText,
                    priority === p.id && { color: p.color, fontWeight: '700' },
                  ]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.raised,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.3,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderRadius: 20,
  },
  saveBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: theme.error,
  },
  input: {
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: theme.text,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: 15,
    zIndex: 1,
  },
  inputIconPadded: {
    paddingLeft: 40,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: theme.surface,
    borderColor: theme.text,
  },
  chipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: theme.text,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBtnText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
