import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useWeddingStore } from '../../store/weddingStore';
import { useBudgetStore } from '../../store/budgetStore';
import { formatCurrency } from '../../lib/utils/currency';
import { BUDGET_CATEGORIES } from '../../lib/constants';
import { createBudgetCategory } from '../../lib/api/budgetOffline';
import { theme } from '../../config/theme';
import { usePerformanceTracking } from '../../lib/hooks/usePerformanceTracking';

export default function BudgetScreen() {
  const { wedding } = useWeddingStore();
  const { categories, expenses, setCategories } = useBudgetStore();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');

  // Track screen load performance
  usePerformanceTracking('budget');

  const totalBudget = wedding?.budget || 0;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Use categories from store without defaults
  const budgetCategories = categories;

  const handleAddCategory = async () => {
    if (!wedding) {
      Alert.alert('Error', 'Please complete your wedding setup first');
      return;
    }
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (!newCategoryBudget.trim()) {
      Alert.alert('Error', 'Please enter a budget amount');
      return;
    }

    try {
      const newCategory = await createBudgetCategory(
        wedding.id,
        newCategoryName.trim(),
        parseFloat(newCategoryBudget)
      );
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setNewCategoryBudget('');
      setShowAddCategory(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getCategoryColor = (categoryName: string) => {
    const category = BUDGET_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#999';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-expense')}>
          <Ionicons name="add" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewLabel}>Total Budget</Text>
        <Text style={styles.overviewAmount}>{formatCurrency(totalBudget)}</Text>
        
        <View style={styles.overviewStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValueSpent}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValueRemaining}>{formatCurrency(remainingBudget)}</Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable style={styles.addCategoryButton} onPress={() => setShowAddCategory(!showAddCategory)}>
            <Ionicons name={showAddCategory ? "close" : "add"} size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Add Category Form */}
        {showAddCategory && (
          <View style={styles.addCategoryForm}>
            <TextInput
              style={styles.input}
              placeholder="Category name (e.g., Venue, Catering)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholderTextColor={theme.textDisabled}
            />
            <TextInput
              style={styles.input}
              placeholder="Budget amount"
              value={newCategoryBudget}
              onChangeText={setNewCategoryBudget}
              keyboardType="numeric"
              placeholderTextColor={theme.textDisabled}
            />
            <Pressable style={styles.submitButton} onPress={handleAddCategory}>
              <Text style={styles.submitButtonText}>Create Category</Text>
            </Pressable>
          </View>
        )}
        
        {budgetCategories.length > 0 ? (
          budgetCategories.map((category) => {
            const progress = getProgressPercentage(category.spent_amount, category.budget_amount);
            const isOverBudget = category.spent_amount > category.budget_amount;
            const color = getCategoryColor(category.name);
            
            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(category.spent_amount)} / {formatCurrency(category.budget_amount)}
                  </Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progress}%`,
                        backgroundColor: isOverBudget ? theme.error : color,
                      },
                    ]} 
                  />
                </View>
                
                {isOverBudget && (
                  <Text style={styles.overBudgetText}>Over budget by {formatCurrency(category.spent_amount - category.budget_amount)}</Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={theme.textDisabled} />
            <Text style={styles.emptyText}>No budget categories yet</Text>
            <Text style={styles.emptySubtext}>Create categories to track your wedding expenses</Text>
          </View>
        )}
      </View>

      {/* Recent Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <Pressable>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        
        {expenses.length > 0 ? (
          expenses.slice(0, 5).map((expense) => (
            <Pressable
              key={expense.id}
              style={styles.expenseCard}
              onPress={() => router.push({ pathname: '/expense-detail', params: { id: expense.id } })}
            >
              <View style={styles.expenseIcon}>
                <Ionicons name="receipt" size={24} color={theme.text} />
              </View>
              <View style={styles.expenseContent}>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseDate}>{expense.payment_date || 'No date'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textDisabled} />
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No expenses yet</Text>
        )}
      </View>

      {/* Export Button */}
      <Pressable style={styles.exportButton}>
        <Ionicons name="download" size={20} color={theme.text} />
        <Text style={styles.exportButtonText}>Export Budget Report</Text>
      </Pressable>
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
  overviewCard: {
    margin: 24,
    padding: 24,
    backgroundColor: theme.surface,
    borderRadius: 16,
  },
  overviewLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: theme.typography.stat.fontSize,
    fontWeight: theme.typography.stat.fontWeight,
    fontFamily: theme.typography.stat.fontFamily,
    color: theme.text,
    marginBottom: 24,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  statValueSpent: {
    fontSize: theme.typography.stat.fontSize,
    fontWeight: theme.typography.stat.fontWeight,
    fontFamily: theme.typography.stat.fontFamily,
    color: theme.success,
  },
  statValueRemaining: {
    fontSize: theme.typography.stat.fontSize,
    fontWeight: theme.typography.stat.fontWeight,
    fontFamily: theme.typography.stat.fontFamily,
    color: theme.info,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.surface.raised,
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
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    fontFamily: theme.typography.heading.fontFamily,
    color: theme.text,
    marginBottom: 0,
  },
  addCategoryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryForm: {
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.text,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: theme.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
  },
  categoryAmount: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.error,
    marginTop: 8,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: theme.typography.mono.fontSize,
    fontWeight: theme.typography.mono.fontWeight,
    fontFamily: theme.typography.mono.fontFamily,
    color: theme.textSecondary,
  },
  expenseAmount: {
    fontSize: theme.typography.stat.fontSize,
    fontWeight: theme.typography.stat.fontWeight,
    fontFamily: theme.typography.stat.fontFamily,
    color: theme.error,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
  },
  exportButtonText: {
    color: theme.text,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    fontFamily: theme.typography.button.fontFamily,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textDisabled,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptySubtext: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textDisabled,
    textAlign: 'center',
    marginTop: 8,
  },
});
