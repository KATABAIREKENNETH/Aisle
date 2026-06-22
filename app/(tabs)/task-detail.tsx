import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/taskStore';
import { TaskPriority, TaskStatus } from '../../types/task';
import { updateTask, deleteTask } from '../../lib/api/tasks';
import { TASK_CATEGORIES } from '../../lib/constants';
import { theme as appTheme } from '../../config/theme';
import CustomDatePicker from '../../components/CustomDatePicker';

export default function TaskDetailScreen() {
  const params = useLocalSearchParams();
  const taskId = params.id as string;
  const { tasks, setTasks } = useTaskStore();
  const task = tasks.find(t => t.id === taskId);
  
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || '');
  const [loading, setLoading] = useState(false);

  const safeBack = () => {
    router.back();
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const handleToggleComplete = async () => {
    try {
      setLoading(true);
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateTask(taskId, {
        title,
        description,
        due_date: dueDate,
        priority,
        category,
      });
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setTasks(tasks.filter(t => t.id !== taskId));
              safeBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        },
      ]
    );
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return appTheme.error;
      case 'medium': return appTheme.warning;
      case 'low': return appTheme.success;
      default: return appTheme.textDisabled;
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return appTheme.success;
      case 'in_progress': return appTheme.info;
      case 'pending': return appTheme.warning;
      default: return appTheme.textDisabled;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={safeBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Task Details</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color={appTheme.error} />
        </Pressable>
      </View>

      {/* Task Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {getStatusLabel(task.status)}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
              {getPriorityLabel(task.priority)}
            </Text>
          </View>
        </View>

        {editing ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            autoFocus
          />
        ) : (
          <Text style={styles.title}>{task.title}</Text>
        )}

        {editing ? (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Task description"
            multiline
            numberOfLines={4}
          />
        ) : (
          <Text style={styles.description}>
            {task.description || 'No description added'}
          </Text>
        )}

        {/* Category */}
        <View style={styles.infoRow}>
          <Ionicons name="folder" size={20} color={appTheme.textSecondary} />
          {editing ? (
            <View style={styles.categorySelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TASK_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.infoText}>{task.category || 'Uncategorized'}</Text>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={appTheme.textSecondary} />
          {editing ? (
            <View style={{ flex: 1 }}>
              <CustomDatePicker date={dueDate} onDateChange={setDueDate} />
            </View>
          ) : (
            <Text style={styles.infoText}>
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
            </Text>
          )}
        </View>

        {/* Priority */}
        <View style={styles.infoRow}>
          <Ionicons name="flag" size={20} color={appTheme.textSecondary} />
          {editing ? (
            <View style={styles.prioritySelector}>
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <Pressable
                  key={p}
                  style={[
                    styles.priorityOption,
                    priority === p && styles.priorityOptionSelected,
                    { borderColor: getPriorityColor(p) }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]} />
                  <Text style={[
                    styles.priorityOptionText,
                    priority === p && styles.priorityOptionTextSelected
                  ]}>
                    {getPriorityLabel(p)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.infoText}>{getPriorityLabel(task.priority)} Priority</Text>
          )}
        </View>

        {/* Created Date */}
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color={appTheme.textSecondary} />
          <Text style={styles.infoText}>
            Created {new Date(task.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={[styles.actionButton, styles.completeButton]} 
          onPress={handleToggleComplete}
          disabled={loading}
        >
          <Ionicons 
            name={task.status === 'completed' ? 'checkmark-circle' : 'radio-button-off'} 
            size={20} 
            color={appTheme.text} 
          />
          <Text style={styles.actionButtonText}>
            {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
          </Text>
        </Pressable>

        {editing ? (
          <Pressable style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={loading}>
            <Text style={styles.actionButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionButton, styles.editButton]} onPress={() => setEditing(true)}>
            <Ionicons name="create" size={20} color={appTheme.text} />
            <Text style={styles.actionButtonText}>Edit Task</Text>
          </Pressable>
        )}
      </View>

      {/* Subtasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subtasks</Text>
        <Pressable style={styles.addSubtaskButton}>
          <Ionicons name="add" size={20} color={appTheme.text} />
          <Text style={styles.addSubtaskText}>Add Subtask</Text>
        </Pressable>
        <Text style={styles.emptyText}>No subtasks yet</Text>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.emptyText}>No notes added</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  errorText: {
    fontSize: 16,
    color: appTheme.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.text,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: appTheme.colors.surface.raised,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 12,
    backgroundColor: appTheme.background,
    padding: 12,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: appTheme.background,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  categorySelector: {
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: appTheme.background,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: appTheme.surface,
  },
  categoryChipText: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  categoryChipTextSelected: {
    color: appTheme.text,
  },
  prioritySelector: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: appTheme.background,
    borderWidth: 1,
  },
  priorityOptionSelected: {
    backgroundColor: appTheme.surface,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityOptionText: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  priorityOptionTextSelected: {
    color: appTheme.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: appTheme.success,
  },
  editButton: {
    backgroundColor: appTheme.colors.surface.raised,
  },
  saveButton: {
    backgroundColor: appTheme.surface,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  editButtonText: {
    color: appTheme.text,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 12,
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  addSubtaskText: {
    fontSize: 14,
    color: appTheme.text,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    fontStyle: 'italic',
  },
});
