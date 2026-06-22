import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase/client';
import { logRSVPActivity } from '../../lib/activity/logger';

export default function RSVPScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [mealPreference, setMealPreference] = useState('');
  const [accommodationNeeded, setAccommodationNeeded] = useState(false);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wedding, setWedding] = useState<any>(null);
  const [existingGuest, setExistingGuest] = useState<any>(null);

  useEffect(() => {
    loadWeddingDetails();
    checkExistingGuest();
  }, [id]);

  const loadWeddingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setWedding(data);
    } catch (error) {
      console.error('Error loading wedding:', error);
      Alert.alert('Error', 'Could not load wedding details');
    }
  };

  const checkExistingGuest = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const guest = data[0];
        setExistingGuest(guest);
        setGuestName(guest.name || '');
        setGuestEmail(guest.email || '');
        setGuestPhone(guest.phone || '');
        setDietaryNeeds(guest.dietary_needs || '');
        setPlusOne(guest.plus_one || false);
        setPlusOneName(guest.plus_one_name || '');
        setMealPreference(guest.meal_preference || '');
        setAccommodationNeeded(guest.accommodation_needed || false);
        setAccessibilityNeeds(guest.accessibility_needs || '');
      }
    } catch (error) {
      console.error('Error checking existing guest:', error);
    }
  };

  const handleSubmitRSVP = async () => {
    if (!guestName || !guestEmail) {
      Alert.alert('Required Fields', 'Please enter your name and email');
      return;
    }

    if (plusOne && !plusOneName) {
      Alert.alert('Plus One Name', 'Please enter your plus one\'s name');
      return;
    }

    setLoading(true);
    try {
      const guestData = {
        wedding_id: id,
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        dietary_needs: dietaryNeeds,
        plus_one: plusOne,
        plus_one_name: plusOneName,
        meal_preference: mealPreference,
        accommodation_needed: accommodationNeeded,
        accessibility_needs: accessibilityNeeds,
        rsvp_status: 'attending',
      };

      let error;
      if (existingGuest) {
        const { error: updateError } = await supabase
          .from('guests')
          .update(guestData)
          .eq('id', existingGuest.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('guests')
          .insert(guestData);
        error = insertError;
      }

      if (error) throw error;

      await logRSVPActivity(
        existingGuest ? 'RSVP Updated' : 'RSVP Submitted',
        existingGuest?.id,
        id as string,
        {
          guest_name: guestName,
          guest_email: guestEmail,
          rsvp_status: 'attending',
          plus_one: plusOne,
        }
      );

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      Alert.alert('Error', 'Could not submit RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!wedding) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>RSVP Submitted!</Text>
          <Text style={styles.successMessage}>
            Thank you for your response. We look forward to celebrating with you!
          </Text>
          <Text style={styles.weddingDate}>
            {new Date(wedding.wedding_date).toLocaleDateString()}
          </Text>
          <Text style={styles.weddingLocation}>
            {wedding.wedding_location || 'Location TBD'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>You're Invited!</Text>
        <Text style={styles.headerSubtitle}>
          Help us celebrate our special day
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.coupleName}>
          {wedding.venue_name || 'Our Wedding'}
        </Text>
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.detailText}>
            {new Date(wedding.wedding_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {wedding.wedding_location && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.detailText}>{wedding.wedding_location}</Text>
          </View>
        )}

        {wedding.theme && (
          <View style={styles.themeBadge}>
            <Text style={styles.themeText}>{wedding.theme}</Text>
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>RSVP Form</Text>

        <Text style={styles.label}>Your Name *</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="Enter your full name"
            value={guestName}
            onChangeText={setGuestName}
          />
        </View>

        <Text style={styles.label}>Email Address *</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="your@email.com"
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="(optional)"
            value={guestPhone}
            onChangeText={setGuestPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.label}>Dietary Requirements</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="restaurant-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.inputWithPadding, styles.textArea]}
            placeholder="Any dietary restrictions or allergies?"
            value={dietaryNeeds}
            onChangeText={setDietaryNeeds}
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={styles.label}>Meal Preference</Text>
        <View style={styles.optionsContainer}>
          {['Chicken', 'Beef', 'Fish', 'Vegetarian', 'Vegan'].map((option) => (
            <Pressable
              key={option}
              style={[
                styles.optionButton,
                mealPreference === option && styles.optionButtonSelected,
              ]}
              onPress={() => setMealPreference(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  mealPreference === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable 
          style={styles.checkboxRow}
          onPress={() => setPlusOne(!plusOne)}
        >
          <View style={[styles.checkbox, plusOne && styles.checkboxChecked]}>
            {plusOne && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I'm bringing a plus one</Text>
        </Pressable>

        {plusOne && (
          <View style={styles.inputWithIcon}>
            <Ionicons name="person-add-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithPadding}
              placeholder="Plus one's name"
              value={plusOneName}
              onChangeText={setPlusOneName}
            />
          </View>
        )}

        <Pressable 
          style={styles.checkboxRow}
          onPress={() => setAccommodationNeeded(!accommodationNeeded)}
        >
          <View style={[styles.checkbox, accommodationNeeded && styles.checkboxChecked]}>
            {accommodationNeeded && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I need accommodation</Text>
        </Pressable>

        <Text style={styles.label}>Accessibility Needs</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="accessibility-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.inputWithPadding, styles.textArea]}
            placeholder="Any accessibility requirements?"
            value={accessibilityNeeds}
            onChangeText={setAccessibilityNeeds}
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable 
          style={styles.submitButton}
          onPress={handleSubmitRSVP}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit RSVP'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        Powered by Aisle Wedding Planning
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coupleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
  },
  themeBadge: {
    alignSelf: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  themeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  form: {
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingLeft: 48,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a1a1a',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  weddingDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  weddingLocation: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
});
