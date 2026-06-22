import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useWeddingStore } from '../../store/weddingStore';
import { useGuestStore } from '../../store/guestStore';
import { theme as appTheme } from '../../config/theme';

export default function RSVPLinksScreen() {
  const { wedding } = useWeddingStore();
  const { guests } = useGuestStore();
  
  const [rsvpLink, setRsvpLink] = useState(`https://aisle.app/rsvp/${wedding?.id || 'demo'}`);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(rsvpLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    try {
      await Sharing.shareAsync(rsvpLink);
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`RSVP for ${wedding?.venue_name || 'Our Wedding'}`);
    const body = encodeURIComponent(`You're invited to our wedding! Please RSVP at: ${rsvpLink}`);
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSendSMS = () => {
    const body = encodeURIComponent(`You're invited to our wedding! RSVP at: ${rsvpLink}`);
    Linking.openURL(`sms:?body=${body}`);
  };

  const handleGenerateNewLink = () => {
    const newLinkId = Math.random().toString(36).substring(2, 15);
    const newLink = `https://aisle.app/rsvp/${wedding?.id || 'demo'}/${newLinkId}`;
    setRsvpLink(newLink);
    Alert.alert('New Link Generated', 'A new RSVP link has been generated');
  };

  const handleTestRSVP = () => {
    Linking.openURL(rsvpLink);
  };

  const confirmedCount = guests.filter(g => g.rsvp_status === 'attending').length;
  const declinedCount = guests.filter(g => g.rsvp_status === 'declined').length;
  const pendingCount = guests.filter(g => g.rsvp_status === 'invited' || g.rsvp_status === 'opened').length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RSVP Links</Text>
        <Text style={styles.subtitle}>Manage your wedding RSVP links</Text>
      </View>

      {/* Main RSVP Link */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your RSVP Link</Text>
        
        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Ionicons name="link" size={24} color={appTheme.text} />
            <Text style={styles.linkLabel}>Main RSVP Link</Text>
          </View>
          
          <View style={styles.linkUrlContainer}>
            <Text style={styles.linkUrl} numberOfLines={1}>
              {rsvpLink}
            </Text>
            <Pressable style={styles.copyButton} onPress={handleCopyLink}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color={appTheme.text} />
            </Pressable>
          </View>

          <View style={styles.linkActions}>
            <Pressable style={styles.linkActionButton} onPress={handleShareLink}>
              <Ionicons name="share-social" size={20} color={appTheme.text} />
              <Text style={styles.linkActionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.linkActionButton} onPress={handleSendEmail}>
              <Ionicons name="mail" size={20} color={appTheme.text} />
              <Text style={styles.linkActionText}>Email</Text>
            </Pressable>
            <Pressable style={styles.linkActionButton} onPress={handleSendSMS}>
              <Ionicons name="chatbubble" size={20} color={appTheme.text} />
              <Text style={styles.linkActionText}>SMS</Text>
            </Pressable>
          </View>

          <Pressable style={styles.generateButton} onPress={handleGenerateNewLink}>
            <Ionicons name="refresh" size={16} color={appTheme.textSecondary} />
            <Text style={styles.generateButtonText}>Generate New Link</Text>
          </Pressable>
        </View>
      </View>

      {/* RSVP Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RSVP Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{guests.length}</Text>
            <Text style={styles.statLabel}>Total Guests</Text>
          </View>
          <View style={[styles.statCard, styles.statCardConfirmed]}>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={[styles.statCard, styles.statCardDeclined]}>
            <Text style={styles.statValue}>{declinedCount}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share the Link</Text>
            <Text style={styles.stepDescription}>
              Share your RSVP link with guests via email, text, or social media
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Guests RSVP Online</Text>
            <Text style={styles.stepDescription}>
              Guests can RSVP without downloading the app using any web browser
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Track Responses</Text>
            <Text style={styles.stepDescription}>
              View RSVP responses in real-time in your app dashboard
            </Text>
          </View>
        </View>
      </View>

      {/* Test RSVP */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test RSVP Flow</Text>
        <Text style={styles.sectionSubtitle}>
          Open your RSVP link to test the guest experience
        </Text>
        
        <Pressable style={styles.testButton} onPress={handleTestRSVP}>
          <Ionicons name="open-outline" size={20} color={appTheme.text} />
          <Text style={styles.testButtonText}>Open RSVP Link</Text>
        </Pressable>
      </View>

      {/* Customization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customization</Text>
        
        <Pressable style={styles.customizationItem}>
          <View style={styles.customizationLeft}>
            <Ionicons name="color-palette" size={24} color={appTheme.textSecondary} />
            <Text style={styles.customizationText}>Custom Theme</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>

        <Pressable style={styles.customizationItem}>
          <View style={styles.customizationLeft}>
            <Ionicons name="image" size={24} color={appTheme.textSecondary} />
            <Text style={styles.customizationText}>Add Cover Photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>

        <Pressable style={styles.customizationItem}>
          <View style={styles.customizationLeft}>
            <Ionicons name="document-text" size={24} color={appTheme.textSecondary} />
            <Text style={styles.customizationText}>Custom Message</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>

        <Pressable style={styles.customizationItem}>
          <View style={styles.customizationLeft}>
            <Ionicons name="calendar" size={24} color={appTheme.textSecondary} />
            <Text style={styles.customizationText}>RSVP Deadline</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={appTheme.textDisabled} />
        </Pressable>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={appTheme.textSecondary} />
        <Text style={styles.infoText}>
          The RSVP link works on any device - desktop, tablet, or mobile. No app download required for guests.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginBottom: 16,
  },
  linkCard: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 20,
    borderRadius: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
  },
  linkUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  linkUrl: {
    flex: 1,
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  copyButton: {
    padding: 8,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  linkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: appTheme.background,
    padding: 12,
    borderRadius: 8,
  },
  linkActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.text,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: appTheme.background,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardConfirmed: {
    backgroundColor: appTheme.colors.surface.overlay,
  },
  statCardDeclined: {
    backgroundColor: appTheme.colors.surface.overlay,
  },
  statCardPending: {
    backgroundColor: appTheme.colors.surface.overlay,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appTheme.surface,
    paddingVertical: 14,
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
  },
  customizationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  customizationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customizationText: {
    fontSize: 16,
    color: appTheme.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    margin: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
});
