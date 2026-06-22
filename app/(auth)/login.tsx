import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { signIn } from '../../lib/supabase/auth';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../config/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setUser, setSession } = useAuthStore();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await signIn(email, password);
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          avatar_url: data.user.user_metadata?.avatar_url,
          role: data.user.user_metadata?.role || 'couple',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at,
        });
        setSession(data.session);
        
        // Navigation will be handled by auth state change listener in root layout
        // It will check if user has wedding and redirect accordingly
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back to Aisle</Text>

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

            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textDisabled} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithPadding, styles.inputWithEyePadding]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={theme.textDisabled}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textDisabled} />
              </Pressable>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            <Pressable style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.secondaryButtonText}>Don't have an account? Sign Up</Text>
            </Pressable>
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
    backgroundColor: 'transparent',
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
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
  inputWithEyePadding: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
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
  primaryButtonText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPassword: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
