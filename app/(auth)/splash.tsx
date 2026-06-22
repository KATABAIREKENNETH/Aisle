import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { theme } from '../../config/theme';

export default function SplashScreen() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show the "Get Started" button after 2 seconds
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Aisle</Text>
          <Text style={styles.tagline}>Plan Your Perfect Wedding with Ease</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar-outline" size={24} color={theme.text} />
            </View>
            <Text style={styles.featureText}>Track Your Timeline</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="wallet-outline" size={24} color={theme.text} />
            </View>
            <Text style={styles.featureText}>Manage Your Budget</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="people-outline" size={24} color={theme.text} />
            </View>
            <Text style={styles.featureText}>Organize Your Guests</Text>
          </View>
        </View>
      </View>

      {showButton && (
        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  features: {
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 32,
  },
  button: {
    backgroundColor: theme.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  signInText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
