import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTaskStore } from '../../store/taskStore';
import { toggleTaskStatus } from '../../lib/api/tasks';
import { theme } from '../../config/theme';
import { usePerformanceTracking } from '../../lib/hooks/usePerformanceTracking';

export default function TasksScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { tasks, setSelectedCategory: setStoreCategory, toggleTaskStatus: toggleStoreStatus } = useTaskStore();

  // Track screen load performance
  usePerformanceTracking('tasks');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'venue', label: 'Venue' },
    { id: 'catering', label: 'Catering' },
    { id: 'attire', label: 'Attire' },
    { id: 'photography', label: 'Photography' },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.error;
      case 'medium':
        return theme.warning;
      case 'low':
        return theme.success;
      default:
        return theme.textDisabled;
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await toggleTaskStatus(taskId, newStatus as any);
      toggleStoreStatus(taskId, newStatus as any);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-task')}>
          <Ionicons name="add" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.textDisabled} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              setStoreCategory(category.id);
            }}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Task List */}
      <ScrollView style={styles.taskList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Pressable 
              key={task.id} 
              style={styles.taskCard}
              onPress={() => router.push({ pathname: '/task-detail', params: { id: task.id } })}
            >
              <Pressable 
                style={[styles.checkbox, task.status === 'completed' && styles.checkboxCompleted]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleTask(task.id, task.status);
                }}
              >
                {task.status === 'completed' && (
                  <Ionicons name="checkmark" size={16} color={theme.text} />
                )}
              </Pressable>
              <View style={styles.taskContent}>
                <Text style={[
                  styles.taskTitle,
                  task.status === 'completed' && styles.taskTitleCompleted,
                ]}>
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  <Text style={styles.taskDue}>• {task.due_date || 'No due date'}</Text>
                </View>
              </View>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Ionicons name="ellipsis-vertical" size={20} color={theme.textDisabled} />
              </Pressable>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No tasks found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    fontFamily: theme.typography.heading.fontFamily,
    color: theme.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexGrow: 0,
  },
  categoriesContent: {
    alignItems: 'center',
    paddingRight: 24,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface.raised,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: theme.surface,
  },
  categoryChipText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
  },
  categoryChipTextSelected: {
    color: theme.text,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.text,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textDisabled,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskCategory: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  taskDue: {
    fontSize: theme.typography.mono.fontSize,
    fontWeight: theme.typography.mono.fontWeight,
    fontFamily: theme.typography.mono.fontFamily,
    color: theme.textDisabled,
  },
  checkboxCompleted: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textDisabled,
    textAlign: 'center',
    padding: 32,
  },
});
