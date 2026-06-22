import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { validateInvitation, acceptInvitation } from '../../lib/api/invitations';
import { useAuthStore } from '../../store/authStore';
import { theme as appTheme } from '../../config/theme';

export default function AcceptInvitationScreen() {
  const params = useLocalSearchParams();
  const token = params.token as string;
  const type = params.type as 'guest' | 'vendor';
  
  const { user } = useAuthStore();
  const [invitationToken, setInvitationToken] = useState(token || '');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const handleValidateToken = async () => {
    if (!invitationToken.trim()) {
      Alert.alert('Error', 'Please enter an invitation token');
      return;
    }

    try {
      setValidating(true);
      const data = await validateInvitation(invitationToken, type);
      setInvitationData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid invitation token');
    } finally {
      setValidating(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to accept this invitation');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation(invitationToken, user.id, type);
      Alert.alert(
        'Success',
        'Invitation accepted! You can now participate in conversations.',
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)/messages') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open" size={64} color={appTheme.primary} />
        </View>
        
        <Text style={styles.title}>Accept Invitation</Text>
        <Text style={styles.subtitle}>
          Enter your invitation token to join the wedding planning team
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="key" size={20} color={appTheme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Invitation token"
            value={invitationToken}
            onChangeText={setInvitationToken}
            autoCapitalize="none"
          />
          {!token && (
            <Pressable style={styles.validateButton} onPress={handleValidateToken} disabled={validating}>
              {validating ? (
                <ActivityIndicator color={appTheme.primary} size={20} />
              ) : (
                <Text style={styles.validateButtonText}>Validate</Text>
              )}
            </Pressable>
          )}
        </View>

        {invitationData && (
          <View style={styles.invitationDetails}>
            <Text style={styles.detailsTitle}>Invitation Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{invitationData.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{type}</Text>
            </View>
          </View>
        )}

        <Pressable
          style={[styles.acceptButton, (!invitationToken || loading) && styles.acceptButtonDisabled]}
          onPress={handleAcceptInvitation}
          disabled={!invitationToken || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size={20} />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Invitation</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appTheme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: appTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: appTheme.text,
  },
  validateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  validateButtonText: {
    color: appTheme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  invitationDetails: {
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: appTheme.text,
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: appTheme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonDisabled: {
    backgroundColor: appTheme.textDisabled,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: appTheme.textSecondary,
    fontSize: 16,
  },
});
