import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStore } from '../store/guestStore';
import { useWeddingStore } from '../store/weddingStore';
import { createGuest } from '../lib/api/guests';
import { theme } from '../config/theme';

const GROUPS = [
  { id: 'family', label: 'Family', icon: 'home-outline' },
  { id: 'friends', label: 'Friends', icon: 'people-outline' },
  { id: 'coworkers', label: 'Coworkers', icon: 'briefcase-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const safeClose = (fallback: string) => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
};

export default function AddGuestScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('friends');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { addGuest } = useGuestStore();
  const { wedding } = useWeddingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the guest\'s full name.');
      return;
    }

    if (!wedding?.id) return;

    try {
      setIsSubmitting(true);
      const guestData = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: null,
        dietary_needs: dietaryNeeds.trim() || null,
        plus_one: plusOne,
        plus_one_name: plusOne && plusOneName.trim() ? plusOneName.trim() : null,
        group_tag: group,
        rsvp_status: 'invited' as const,
        meal_preference: null,
        accommodation_needed: false,
        accessibility_needs: null,
        children_count: 0,
        table_number: tableNumber.trim() || null,
        notes: notes.trim() || null,
      };

      const newGuest = await createGuest(wedding.id, guestData);
      addGuest(newGuest);
      safeClose('/guests');
    } catch (error) {
      console.error('Error creating guest:', error);
      Alert.alert('Error', 'Failed to add guest. Please try again.');
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
          <Pressable onPress={() => safeClose('/guests')} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Guest</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Avatar preview */}
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarInitials}>
              {name.trim() ? name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
            </Text>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputIconPadded]}
                placeholder="E.g., Jane Smith"
                value={name}
                onChangeText={setName}
                placeholderTextColor={theme.textDisabled}
                autoFocus
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputIconPadded]}
                placeholder="jane@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textDisabled}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="call-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputIconPadded]}
                placeholder="(555) 555-5555"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={theme.textDisabled}
              />
            </View>
          </View>

          {/* Group */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group</Text>
            <View style={styles.groupGrid}>
              {GROUPS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.groupCard, group === g.id && styles.groupCardSelected]}
                  onPress={() => setGroup(g.id)}
                >
                  <Ionicons name={g.icon as any} size={22} color={group === g.id ? theme.text : theme.textSecondary} style={{ marginBottom: 6 }} />
                  <Text style={[styles.groupLabel, group === g.id && styles.groupLabelSelected]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Dietary Needs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dietary Needs</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Vegetarian, Nut allergy"
              value={dietaryNeeds}
              onChangeText={setDietaryNeeds}
              placeholderTextColor={theme.textDisabled}
            />
          </View>

          {/* Plus One */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Allow Plus One</Text>
              <Text style={styles.switchSubLabel}>Guest may bring a companion</Text>
            </View>
            <Switch
              value={plusOne}
              onValueChange={setPlusOne}
              trackColor={{ false: theme.colors.surface.raised, true: theme.surface }}
              thumbColor={plusOne ? theme.text : theme.textDisabled}
            />
          </View>

          {plusOne && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plus One Name</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="person-outline" size={18} color={theme.textDisabled} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputIconPadded]}
                  placeholder="Companion's name (optional)"
                  value={plusOneName}
                  onChangeText={setPlusOneName}
                  placeholderTextColor={theme.textDisabled}
                />
              </View>
            </View>
          )}

          {/* Table Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Table Number</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Table 1, Sweetheart Table"
              value={tableNumber}
              onChangeText={setTableNumber}
              placeholderTextColor={theme.textDisabled}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Any additional notes..."
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={theme.textDisabled}
              multiline
            />
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
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface.raised,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
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
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  groupCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  groupCardSelected: {
    backgroundColor: theme.surface,
    borderColor: theme.text,
  },

  groupLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  groupLabelSelected: {
    color: theme.text,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});
