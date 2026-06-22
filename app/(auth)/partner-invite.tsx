import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme as appTheme } from '../../config/theme';
import { useWeddingStore } from '../../store/weddingStore';
import { sendPartnerInvite } from '../../lib/api/weddings';

export default function PartnerInviteScreen() {
  const { wedding } = useWeddingStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState<'email' | 'link'>('email');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const safeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/onboarding-step1');
  };

  const handleSendInvite = async () => {
    if (method === 'email' && !email) {
      Alert.alert('Email Required', 'Please enter your partner\'s email address');
      return;
    }

    if (!wedding?.id) {
      Alert.alert('Error', 'Wedding not found. Please complete onboarding first.');
      return;
    }

    setLoading(true);
    try {
      if (method === 'email') {
        await sendPartnerInvite(wedding.id, email, name);
        setSent(true);
      } else {
        // Generate invite link
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const inviteLink = `https://aisle.app/invite/${inviteCode}`;
        
        await sendPartnerInvite(wedding.id, '', name);
        Alert.alert(
          'Invite Link Generated',
          inviteLink,
          [
            { text: 'OK', onPress: () => setSent(true) }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/onboarding-step1');
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Pressable onPress={safeBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={appTheme.success} />
          </View>
          <Text style={styles.title}>Invite Sent!</Text>
          <Text style={styles.subtitle}>
            {method === 'email' 
              ? `An invitation has been sent to ${email}`
              : 'Your invite link has been copied to clipboard'
            }
          </Text>
          <Text style={styles.infoText}>
            Your partner can join and help you plan your wedding together.
          </Text>

          <Pressable style={styles.button} onPress={handleSkip}>
            <Text style={styles.buttonText}>Continue to Setup</Text>
          </Pressable>

          <Pressable onPress={() => setSent(false)}>
            <Text style={styles.resendText}>Send another invite</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Pressable onPress={safeBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Invite Your Partner</Text>
        <Text style={styles.subtitle}>
          Plan your wedding together with your significant other
        </Text>

        {/* Method Selection */}
        <View style={styles.methodSelector}>
          <Pressable
            style={[styles.methodOption, method === 'email' && styles.methodOptionSelected]}
            onPress={() => setMethod('email')}
          >
            <Ionicons 
              name="mail" 
              size={24} 
              color={method === 'email' ? appTheme.text : appTheme.textDisabled} 
            />
            <Text style={[
              styles.methodText,
              method === 'email' && styles.methodTextSelected
            ]}>
              Send Email
            </Text>
          </Pressable>
          <Pressable
            style={[styles.methodOption, method === 'link' && styles.methodOptionSelected]}
            onPress={() => setMethod('link')}
          >
            <Ionicons 
              name="link" 
              size={24} 
              color={method === 'link' ? appTheme.text : appTheme.textDisabled} 
            />
            <Text style={[
              styles.methodText,
              method === 'link' && styles.methodTextSelected
            ]}>
              Copy Link
            </Text>
          </Pressable>
        </View>

        {method === 'email' ? (
          <>
            <Text style={styles.label}>Partner's Name</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={20} color={appTheme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithPadding}
                placeholder="Enter their name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>Partner's Email</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color={appTheme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithPadding}
                placeholder="Enter their email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </>
        ) : (
          <View style={styles.linkPreview}>
            <Ionicons name="link-outline" size={32} color={appTheme.textSecondary} />
            <Text style={styles.linkText}>
              https://aisle.app/invite/abc123
            </Text>
            <Text style={styles.linkInfo}>
              Share this link with your partner to invite them to join your wedding planning
            </Text>
          </View>
        )}

        <View style={styles.footerActions}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>

          <Pressable 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSendInvite}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : method === 'email' ? 'Send Invite' : 'Copy Link'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={appTheme.textSecondary} />
          <Text style={styles.infoBoxText}>
            You can always invite your partner later from your profile settings
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
  contentContainer: {
    padding: 24,
  },
  backButton: {
    marginTop: 48,
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: appTheme.textSecondary,
  },
  content: {
    flex: 1,
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
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: appTheme.colors.surface.raised,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodOptionSelected: {
    backgroundColor: appTheme.surface,
    borderColor: appTheme.surface,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.textDisabled,
  },
  methodTextSelected: {
    color: appTheme.text,
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
    marginBottom: 16,
  },
  inputWithIcon: {
    position: 'relative',
    marginBottom: 16,
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
  linkPreview: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 16,
    color: appTheme.text,
    fontWeight: '600',
  },
  linkInfo: {
    fontSize: 14,
    color: appTheme.textSecondary,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: appTheme.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: appTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
  },
  skipText: {
    color: appTheme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  resendText: {
    color: appTheme.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
