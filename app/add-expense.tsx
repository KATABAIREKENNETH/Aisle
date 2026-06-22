import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../store/budgetStore';
import { useWeddingStore } from '../store/weddingStore';
import { createExpense, createBudgetCategory } from '../lib/api/budgetOffline';
import { BUDGET_CATEGORIES } from '../lib/constants';
import { theme } from '../config/theme';
import CustomDatePicker from '../components/CustomDatePicker';
import { usePerformanceTracking } from '../lib/hooks/usePerformanceTracking';

const safeClose = (fallback: string) => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
};

export default function AddExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const { addExpense, categories } = useBudgetStore();
  const { wedding } = useWeddingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track screen load performance
  usePerformanceTracking('add_expense');

  // Use store categories if available, else fall back to constants
  const displayCategories = categories.length > 0
    ? categories.map(c => ({ id: c.id, name: c.name, color: BUDGET_CATEGORIES.find(b => b.name === c.name)?.color || '#999' }))
    : BUDGET_CATEGORIES.map(c => ({ id: c.name, name: c.name, color: c.color }));

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Validation', 'Title and amount are required.');
      return;
    }

    if (!wedding?.id) return;

    try {
      setIsSubmitting(true);
      
      let finalCategoryId = categoryId;
      if (finalCategoryId && finalCategoryId.length < 36) {
        const defaultCat = BUDGET_CATEGORIES.find(c => c.name === finalCategoryId);
        const newCat = await createBudgetCategory(wedding.id, finalCategoryId, defaultCat?.defaultBudget || 0);
        finalCategoryId = newCat.id;
      }

      const expenseData = {
        title: title.trim(),
        amount: amount.trim(),
        category_id: finalCategoryId || undefined,
        payment_date: date || undefined,
        notes: notes.trim() || undefined,
      };

      const newExpense = await createExpense(wedding.id, expenseData);
      addExpense(newExpense);
      safeClose('/budget');
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
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
          <Pressable onPress={() => safeClose('/budget')} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Expense</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isSubmitting}>
            <Text style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Amount — prominent at the top */}
          <View style={styles.amountCard}>
            <Text style={styles.currencySymbol}>UGX</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textDisabled}
              autoFocus
            />
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expense Title <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="document-text-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputIconPadded]}
                placeholder="E.g., Venue deposit"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={theme.textDisabled}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {displayCategories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.chip,
                      categoryId === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                    <Text style={[
                      styles.chipText,
                      categoryId === cat.id && { color: cat.color, fontWeight: '700' },
                    ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Payment Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date</Text>
            <CustomDatePicker date={date} onDateChange={setDate} />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="create-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, styles.inputIconPadded]}
                placeholder="Any additional details..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.textDisabled}
                textAlignVertical="top"
              />
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
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 28,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.textSecondary,
    marginRight: 4,
    lineHeight: 52,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.text,
    minWidth: 120,
    textAlign: 'center',
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
    height: 90,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
