import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { resetPassword } from '../../lib/supabase/auth';
import { theme } from '../../config/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const safeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
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
        <View style={styles.container}>
          {/* Curved white shape at top */}
          <View style={styles.curvedShape} />

          <View style={styles.content}>
            <Pressable onPress={safeBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.title}>Reset Password</Text>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color={theme.success} style={styles.successIcon} />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to {email}. Check your inbox and follow the instructions.
                </Text>
                <Pressable style={styles.primaryButton} onPress={safeBack}>
                  <Text style={styles.primaryButtonText}>Back to Login</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputWithIcon}>
                  <Ionicons name="mail-outline" size={20} color={theme.textDisabled} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithPadding}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>

                <Pressable 
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.text} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  curvedShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: theme.colors.surface.raised,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 3,
  },
  backText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    paddingLeft: 48,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryButton: {
    backgroundColor: theme.surface,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});
