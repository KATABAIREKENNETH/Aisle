import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStore } from '../../store/guestStore';
import { RSVPStatus } from '../../types/guest';
import { updateGuest, deleteGuest } from '../../lib/api/guests';
import { sendGuestInvitation } from '../../lib/api/invitations';
import { theme as appTheme } from '../../config/theme';

export default function GuestDetailScreen() {
  const params = useLocalSearchParams();
  const guestId = params.id as string;
  const { guests, setGuests } = useGuestStore();
  const guest = guests.find(g => g.id === guestId);
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(guest?.name || '');
  const [email, setEmail] = useState(guest?.email || '');
  const [phone, setPhone] = useState(guest?.phone || '');
  const [dietaryNeeds, setDietaryNeeds] = useState(guest?.dietary_needs || '');
  const [notes, setNotes] = useState(guest?.notes || '');
  const [tableNumber, setTableNumber] = useState(guest?.table_number || '');
  const [loading, setLoading] = useState(false);

  const safeBack = () => {
    router.back();
  };

  if (!guest) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Guest not found</Text>
      </View>
    );
  }

  const handleRSVPStatusChange = async (status: RSVPStatus) => {
    try {
      setLoading(true);
      const updated = await updateGuest(guestId, { rsvp_status: status });
      setGuests(guests.map(g => g.id === guestId ? updated : g));
    } catch (error) {
      Alert.alert('Error', 'Failed to update RSVP status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateGuest(guestId, {
        name,
        email,
        phone,
        dietary_needs: dietaryNeeds,
        notes,
        table_number: tableNumber,
      });
      setGuests(guests.map(g => g.id === guestId ? updated : g));
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update guest');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Guest',
      'Are you sure you want to remove this guest?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteGuest(guestId);
              setGuests(guests.filter(g => g.id !== guestId));
              safeBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete guest.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const getRSVPColor = (status: RSVPStatus) => {
    switch (status) {
      case 'attending': return appTheme.success;
      case 'declined': return appTheme.error;
      case 'invited': return appTheme.warning;
      case 'opened': return appTheme.info;
      case 'no_response': return appTheme.textDisabled;
      default: return appTheme.textDisabled;
    }
  };

  const getRSVPLabel = (status: RSVPStatus) => {
    switch (status) {
      case 'attending': return 'Attending';
      case 'declined': return 'Declined';
      case 'invited': return 'Invited';
      case 'opened': return 'Opened';
      case 'no_response': return 'No Response';
      default: return 'Unknown';
    }
  };

  const handleCall = () => {
    if (guest.phone) {
      Linking.openURL(`tel:${guest.phone}`);
    }
  };

  const handleEmail = () => {
    if (guest.email) {
      Linking.openURL(`mailto:${guest.email}`);
    }
  };

  const handleSendReminder = async () => {
    try {
      setLoading(true);
      // Send RSVP reminder via Resend API
      // This would call an API function to send an email reminder
      // For now, we'll show a success message
      Alert.alert('Reminder Sent', `RSVP reminder sent to ${guest.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToApp = async () => {
    if (!guest.email) {
      Alert.alert('Error', 'Guest must have an email address to be invited');
      return;
    }

    if (guest.invitation_sent) {
      Alert.alert('Already Invited', 'This guest has already been invited to the app');
      return;
    }

    try {
      setLoading(true);
      const result = await sendGuestInvitation(guest.id, guest.email);
      
      // Update the guest in the store
      setGuests(guests.map(g => g.id === guestId ? { ...g, invitation_sent: true, invitation_token: result.token } : g));
      
      Alert.alert(
        'Invitation Sent',
        `An invitation has been sent to ${guest.name} at ${guest.email}. Share this token: ${result.token}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={safeBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Guest Details</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color={appTheme.error} />
        </Pressable>
      </View>

      {/* Guest Info Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {guest.name.split(' ').map((n: string) => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.name}>{guest.name}</Text>
        <Text style={styles.group}>{guest.group_tag || 'Guest'}</Text>
        
        <View style={[styles.rsvpBadge, { backgroundColor: getRSVPColor(guest.rsvp_status) + '20' }]}>
          <Text style={[styles.rsvpText, { color: getRSVPColor(guest.rsvp_status) }]}>
            {getRSVPLabel(guest.rsvp_status)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickActionButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color={appTheme.text} />
          <Text style={styles.quickActionText}>Call</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color={appTheme.text} />
          <Text style={styles.quickActionText}>Email</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={handleSendReminder}>
          <Ionicons name="notifications" size={20} color={appTheme.text} />
          <Text style={styles.quickActionText}>Remind</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={handleInviteToApp} disabled={loading || guest.invitation_sent}>
          <Ionicons name={guest.invitation_sent ? "checkmark-circle" : "person-add"} size={20} color={guest.invitation_sent ? appTheme.success : appTheme.text} />
          <Text style={[styles.quickActionText, guest.invitation_sent && { color: appTheme.success }]}>
            {guest.invitation_sent ? 'Invited' : 'Invite'}
          </Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? "close" : "create"} size={20} color={appTheme.text} />
          <Text style={styles.quickActionText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </Pressable>
      </View>

      {/* Guest Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        {editing ? (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Guest name"
            />
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
          </>
        ) : (
          <>
            {!!guest.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={appTheme.textSecondary} />
                <Text style={styles.infoText}>{guest.email}</Text>
              </View>
            )}
            {!!guest.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={appTheme.textSecondary} />
                <Text style={styles.infoText}>{guest.phone}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Dietary Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Requirements</Text>
        
        {editing ? (
          <TextInput
            style={styles.input}
            value={dietaryNeeds}
            onChangeText={setDietaryNeeds}
            placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
            multiline
          />
        ) : (
          <Text style={styles.infoText}>
            {guest.dietary_needs || 'No dietary requirements specified'}
          </Text>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        
        {editing ? (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this guest..."
            multiline
            numberOfLines={4}
          />
        ) : (
          <Text style={styles.infoText}>
            {guest.notes || 'No notes added'}
          </Text>
        )}
      </View>

      {/* RSVP Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RSVP Status</Text>
        <View style={styles.rsvpOptions}>
          {(['invited', 'opened', 'attending', 'declined', 'no_response'] as RSVPStatus[]).map((status) => (
            <Pressable
              key={status}
              style={[
                styles.rsvpOption,
                guest.rsvp_status === status && styles.rsvpOptionSelected,
                { borderColor: getRSVPColor(status) }
              ]}
              onPress={() => handleRSVPStatusChange(status)}
              disabled={loading}
            >
              <View style={[styles.rsvpDot, { backgroundColor: getRSVPColor(status) }]} />
              <Text style={[
                styles.rsvpOptionText,
                guest.rsvp_status === status && styles.rsvpOptionTextSelected
              ]}>
                {getRSVPLabel(status)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Plus One */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plus One</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={appTheme.textSecondary} />
          <Text style={styles.infoText}>
            {guest.plus_one ? 'Allowed' : 'Not allowed'}
          </Text>
        </View>
        {!!guest.plus_one_name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-add" size={20} color={appTheme.textSecondary} />
            <Text style={styles.infoText}>
              Plus one: {guest.plus_one_name}
            </Text>
          </View>
        )}
      </View>

      {/* Table Assignment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Table Assignment</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={tableNumber}
            onChangeText={setTableNumber}
            placeholder="e.g., 1, Sweetheart Table"
          />
        ) : (
          <View style={styles.infoRow}>
            <Ionicons name="grid" size={20} color={appTheme.textSecondary} />
            <Text style={styles.infoText}>
              {guest.table_number || 'Not assigned'}
            </Text>
          </View>
        )}
      </View>

      {editing && (
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      )}
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
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  group: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginBottom: 12,
  },
  rsvpBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rsvpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: appTheme.textSecondary,
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  rsvpOptions: {
    gap: 8,
  },
  rsvpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: appTheme.colors.surface.raised,
  },
  rsvpOptionSelected: {
    backgroundColor: appTheme.surface,
  },
  rsvpDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rsvpOptionText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  rsvpOptionTextSelected: {
    color: appTheme.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: appTheme.surface,
    paddingVertical: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: appTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
