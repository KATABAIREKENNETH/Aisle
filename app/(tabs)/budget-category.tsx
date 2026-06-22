import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { formatCurrency } from '../../lib/utils/currency';
import { BUDGET_CATEGORIES } from '../../lib/constants';
import { createExpense, updateBudgetCategory } from '../../lib/api/budgetOffline';
import { theme as appTheme } from '../../config/theme';

export default function BudgetCategoryScreen() {
  const params = useLocalSearchParams();
  const categoryId = params.id as string;
  const { categories, expenses, setCategories, setExpenses } = useBudgetStore();
  
  const category = categories.find(c => c.id === categoryId);
  const categoryExpenses = expenses.filter(e => e.category_id === categoryId);
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  const safeBack = () => {
    router.back();
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  const totalSpent = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const remaining = (category.budget_amount || 0) - totalSpent;
  const progress = category.budget_amount > 0 ? (totalSpent / category.budget_amount) * 100 : 0;

  const getCategoryColor = (categoryName: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.name === categoryName);
    return cat?.color || '#999';
  };

  const getCategoryColorByName = (categoryName: string) => {
    return getCategoryColor(categoryName);
  };

  const handleAddExpense = async () => {
    if (!expenseName || !expenseAmount) return;

    try {
      const expense = await createExpense(category.wedding_id, {
        title: expenseName,
        amount: expenseAmount,
        category_id: categoryId,
      });
      setExpenses([...expenses, expense]);
      setExpenseName('');
      setExpenseAmount('');
      setShowAddExpense(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleUpdateBudget = async () => {
    if (!newBudgetAmount) return;

    try {
      const updated = await updateBudgetCategory(categoryId, {
        budget_amount: parseFloat(newBudgetAmount),
      });
      setCategories(categories.map(c => c.id === categoryId ? updated : c));
      setEditingBudget(false);
      setNewBudgetAmount('');
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={safeBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <Pressable style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={appTheme.text} />
        </Pressable>
      </View>

      {/* Budget Overview Card */}
      <View style={[styles.card, { borderTopColor: getCategoryColorByName(category.name) }]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryIconText}>
              {category.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categorySpent}>
              {formatCurrency(totalSpent)} of {formatCurrency(category.budget_amount || 0)} spent
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(progress, 100)}%`, backgroundColor: getCategoryColorByName(category.name) }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>{formatCurrency(category.budget_amount || 0)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, { color: getCategoryColorByName(category.name) }]}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[
              styles.statValue,
              remaining < 0 ? styles.statValueNegative : styles.statValuePositive
            ]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        {/* Edit Budget */}
        {editingBudget ? (
          <View style={styles.editBudgetContainer}>
            <TextInput
              style={styles.budgetInput}
              placeholder="New budget amount"
              value={newBudgetAmount}
              onChangeText={setNewBudgetAmount}
              keyboardType="numeric"
            />
            <Pressable style={styles.saveButton} onPress={handleUpdateBudget}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setEditingBudget(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.editButton} onPress={() => setEditingBudget(true)}>
            <Ionicons name="create" size={16} color={appTheme.textSecondary} />
            <Text style={styles.editButtonText}>Edit Budget</Text>
          </Pressable>
        )}
      </View>

      {/* Add Expense Button */}
      <Pressable 
        style={styles.addExpenseButton} 
        onPress={() => setShowAddExpense(!showAddExpense)}
      >
        <Ionicons name={showAddExpense ? "close" : "add"} size={20} color={appTheme.text} />
        <Text style={styles.addExpenseButtonText}>
          {showAddExpense ? 'Cancel' : 'Add Expense'}
        </Text>
      </Pressable>

      {/* Add Expense Form */}
      {showAddExpense && (
        <View style={styles.expenseForm}>
          <Text style={styles.formTitle}>New Expense</Text>
          <TextInput
            style={styles.input}
            placeholder="Expense name"
            value={expenseName}
            onChangeText={setExpenseName}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={expenseAmount}
            onChangeText={setExpenseAmount}
            keyboardType="numeric"
          />
          <Pressable style={styles.submitButton} onPress={handleAddExpense}>
            <Text style={styles.submitButtonText}>Add Expense</Text>
          </Pressable>
        </View>
      )}

      {/* Expenses List */}
      <View style={styles.expensesSection}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        
        {categoryExpenses.length > 0 ? (
          categoryExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>{expense.title}</Text>
                <Text style={styles.expenseDate}>
                  {new Date(expense.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                {formatCurrency(expense.amount || 0)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt" size={48} color={appTheme.textDisabled} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first expense to start tracking
            </Text>
          </View>
        )}
      </View>

      {/* Budget Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Budget Tips</Text>
        <View style={styles.tip}>
          <Ionicons name="bulb" size={20} color={appTheme.warning} />
          <Text style={styles.tipText}>
            {remaining < 0 
              ? 'You\'ve exceeded your budget. Consider adjusting your spending or increasing the budget.'
              : 'You\'re on track! Keep monitoring your expenses to stay within budget.'
            }
          </Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="information-circle" size={20} color={appTheme.info} />
          <Text style={styles.tipText}>
            Consider setting aside 10-15% of your budget for unexpected expenses.
          </Text>
        </View>
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: appTheme.background,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.surface.raised,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  categorySpent: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.textSecondary,
    width: 40,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: appTheme.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  statValuePositive: {
    color: appTheme.success,
  },
  statValueNegative: {
    color: appTheme.error,
  },
  statDivider: {
    width: 1,
    backgroundColor: appTheme.colors.surface.raised,
  },
  editBudgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: appTheme.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: appTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: appTheme.textSecondary,
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: appTheme.surface,
    borderRadius: 12,
  },
  addExpenseButtonText: {
    color: appTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  expenseForm: {
    margin: 16,
    padding: 20,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: appTheme.background,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: appTheme.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: appTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  expensesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: appTheme.textDisabled,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: appTheme.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: appTheme.textDisabled,
    marginTop: 4,
  },
  tipsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
});
