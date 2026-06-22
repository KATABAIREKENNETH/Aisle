import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { updateExpense, deleteExpense } from '../../lib/api/budgetOffline';
import { BUDGET_CATEGORIES } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils/currency';
import { theme as appTheme } from '../../config/theme';
import CustomDatePicker from '../../components/CustomDatePicker';

export default function ExpenseDetailScreen() {
  const params = useLocalSearchParams();
  const expenseId = params.id as string;
  const { expenses, updateExpense: updateStoreExpense, deleteExpense: deleteStoreExpense } = useBudgetStore();
  const expense = expenses.find(e => e.id === expenseId);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(expense?.category_id || '');
  const [paymentDate, setPaymentDate] = useState(expense?.payment_date || '');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [loading, setLoading] = useState(false);

  const safeBack = () => {
    router.back();
  };

  if (!expense) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={safeBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={appTheme.text} />
          </Pressable>
        </View>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  const getCategoryName = (id: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.name === id);
    return cat?.name || id || 'Unknown';
  };

  const getCategoryColor = (id: string) => {
    const cat = BUDGET_CATEGORIES.find(c => c.name === id);
    return cat?.color || '#999';
  };

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Validation', 'Title and amount are required.');
      return;
    }
    try {
      setLoading(true);
      const updated = await updateExpense(expenseId, {
        title,
        amount,
        category_id: categoryId,
        payment_date: paymentDate,
        notes,
      });
      updateStoreExpense(expenseId, updated);
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteExpense(expenseId);
              deleteStoreExpense(expenseId);
              safeBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const catColor = getCategoryColor(expense.category_id);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={safeBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={appTheme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Expense Details</Text>
          <Pressable onPress={handleDelete} style={styles.deleteButton} disabled={loading}>
            <Ionicons name="trash" size={22} color={appTheme.error} />
          </Pressable>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '22' }]}>
            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
            <Text style={[styles.categoryLabel, { color: catColor }]}>
              {getCategoryName(expense.category_id)}
            </Text>
          </View>
          <Text style={styles.amountText}>{formatCurrency(expense.amount)}</Text>
          <Text style={styles.expenseTitleText}>{expense.title}</Text>
          {expense.payment_date && (
            <Text style={styles.dateText}>
              {new Date(expense.payment_date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {editing ? (
            <>
              <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={loading}>
                <Ionicons name="checkmark" size={18} color={appTheme.text} />
                <Text style={styles.actionBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setEditing(false)}>
                <Ionicons name="close" size={18} color={appTheme.text} />
                <Text style={styles.actionBtnText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => setEditing(true)}>
              <Ionicons name="create" size={18} color={appTheme.text} />
              <Text style={styles.actionBtnText}>Edit Expense</Text>
            </Pressable>
          )}
        </View>

        {/* Details / Edit Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          {editing ? (
            <>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Expense title"
                placeholderTextColor={appTheme.textDisabled}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={appTheme.textDisabled}
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {BUDGET_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.name}
                    style={[
                      styles.chip,
                      categoryId === cat.name && { backgroundColor: cat.color + '33', borderColor: cat.color },
                    ]}
                    onPress={() => setCategoryId(cat.name)}
                  >
                    <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                    <Text style={[
                      styles.chipText,
                      categoryId === cat.name && { color: appTheme.text, fontWeight: '600' },
                    ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>Payment Date</Text>
              <CustomDatePicker date={paymentDate} onDateChange={setPaymentDate} />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                multiline
                numberOfLines={4}
                placeholderTextColor={appTheme.textDisabled}
              />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={18} color={appTheme.textSecondary} />
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{getCategoryName(expense.category_id)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color={appTheme.textSecondary} />
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {expense.payment_date
                    ? new Date(expense.payment_date).toLocaleDateString()
                    : 'No date set'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={appTheme.textSecondary} />
                <Text style={styles.infoLabel}>Added</Text>
                <Text style={styles.infoValue}>
                  {new Date(expense.created_at).toLocaleDateString()}
                </Text>
              </View>
              {!!expense.notes && (
                <View style={styles.notesBox}>
                  <Ionicons name="document-text" size={18} color={appTheme.textSecondary} />
                  <Text style={styles.notesText}>{expense.notes}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 48,
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
  amountCard: {
    margin: 16,
    padding: 28,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 20,
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 8,
  },
  expenseTitleText: {
    fontSize: 18,
    fontWeight: '500',
    color: appTheme.textSecondary,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: appTheme.textDisabled,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  editBtn: {
    backgroundColor: appTheme.colors.surface.raised,
  },
  saveBtn: {
    backgroundColor: appTheme.success,
  },
  cancelBtn: {
    backgroundColor: appTheme.colors.surface.raised,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: appTheme.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: appTheme.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipRow: {
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.raised,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    color: appTheme.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  infoLabel: {
    fontSize: 14,
    color: appTheme.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: appTheme.text,
    fontWeight: '500',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 14,
    borderRadius: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
});
