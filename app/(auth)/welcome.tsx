import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '../../config/theme';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Curved white shape at top */}
        <View style={styles.curvedShape} />
        
        {/* Organic contour lines */}
        <View style={styles.contourLines}>
          <View style={[styles.contourLine, styles.contour1]} />
          <View style={[styles.contourLine, styles.contour2]} />
          <View style={[styles.contourLine, styles.contour3]} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            A place of love, celebration, and beautiful memories. Your wedding planning journey starts here.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
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
    height: 200,
    backgroundColor: theme.colors.surface.raised,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    zIndex: 1,
  },
  contourLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  contourLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  contour1: {
    width: 300,
    height: 150,
    top: 50,
    right: -50,
    transform: [{ rotate: '-15deg' }],
  },
  contour2: {
    width: 200,
    height: 100,
    top: 120,
    left: -30,
    transform: [{ rotate: '20deg' }],
  },
  contour3: {
    width: 250,
    height: 120,
    top: 180,
    right: 50,
    transform: [{ rotate: '-10deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: theme.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
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
  },
  secondaryButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
