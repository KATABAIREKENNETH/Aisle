import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { createWedding } from '../../lib/api/weddings';
import { useAuthStore } from '../../store/authStore';
import { useWeddingStore } from '../../store/weddingStore';
import { theme as appTheme } from '../../config/theme';
import CustomDatePicker from '../../components/CustomDatePicker';

export default function OnboardingScreen() {
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingLocation, setWeddingLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [selectedSize, setSelectedSize] = useState<'intimate' | 'medium' | 'large' | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();
  const { setWedding } = useWeddingStore();

  const handleComplete = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!weddingDate || !weddingLocation) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const wedding = await createWedding(user.id, {
        weddingDate,
        weddingLocation,
        budget,
        guestCount,
        selectedSize,
      });
      
      setWedding(wedding);
      // Navigate to home after successful onboarding
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Let's Plan Your Wedding</Text>
      <Text style={styles.subtitle}>Tell us about your big day</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Text style={styles.label}>Wedding Date</Text>
      <CustomDatePicker
        date={weddingDate}
        onDateChange={setWeddingDate}
        placeholder="Select your wedding date"
      />
      
      <Text style={styles.label}>Location</Text>
      <View style={styles.inputWithIcon}>
        <Ionicons name="location-outline" size={20} color={appTheme.textDisabled} style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithPadding}
          placeholder="City, State or Venue"
          value={weddingLocation}
          onChangeText={setWeddingLocation}
        />
      </View>
      
      <Text style={styles.label}>Budget</Text>
      <View style={styles.inputWithIcon}>
        <Ionicons name="cash-outline" size={20} color={appTheme.textDisabled} style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithPadding}
          placeholder="Total budget (UGX)"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />
      </View>
      
      <Text style={styles.label}>Expected Guest Count</Text>
      <View style={styles.inputWithIcon}>
        <Ionicons name="people-outline" size={20} color={appTheme.textDisabled} style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithPadding}
          placeholder="Number of guests you expect"
          value={guestCount}
          onChangeText={setGuestCount}
          keyboardType="numeric"
        />
      </View>
      
      <Text style={styles.label}>Wedding Size</Text>
      <View style={styles.sizeOptions}>
        {[
          { key: 'intimate', label: 'Intimate', sublabel: '< 50 guests' },
          { key: 'medium', label: 'Medium', sublabel: '50-150 guests' },
          { key: 'large', label: 'Large', sublabel: '150+ guests' },
        ].map((size) => (
          <Pressable
            key={size.key}
            style={[
              styles.sizeOption,
              selectedSize === size.key && styles.sizeOptionSelected,
            ]}
            onPress={() => setSelectedSize(size.key as any)}
          >
            <Text style={[
              styles.sizeOptionLabel,
              selectedSize === size.key && styles.sizeOptionLabelSelected,
            ]}>
              {size.label}
            </Text>
            <Text style={[
              styles.sizeOptionSublabel,
              selectedSize === size.key && styles.sizeOptionSublabelSelected,
            ]}>
              {size.sublabel}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <Pressable 
        style={styles.button} 
        onPress={handleComplete}
        disabled={loading || !weddingDate || !weddingLocation}
      >
        {loading ? (
          <ActivityIndicator color={appTheme.text} />
        ) : (
          <Text style={styles.buttonText}>Start Planning</Text>
        )}
      </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: appTheme.textSecondary,
    marginBottom: 32,
  },
  errorText: {
    color: appTheme.error,
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  inputWithPadding: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    paddingLeft: 48,
    borderRadius: 12,
    fontSize: 16,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  sizeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeOptionSelected: {
    backgroundColor: appTheme.surface,
    borderColor: appTheme.surface,
  },
  sizeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  sizeOptionLabelSelected: {
    color: appTheme.text,
  },
  sizeOptionSublabel: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  sizeOptionSublabelSelected: {
    color: appTheme.textDisabled,
  },
  button: {
    backgroundColor: appTheme.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: appTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
