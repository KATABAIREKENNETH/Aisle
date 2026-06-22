import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, Alert, Modal, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWeddingStore } from '../../store/weddingStore';
import { theme as appTheme } from '../../config/theme';

export default function InviteBuilderScreen() {
  const { wedding } = useWeddingStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState(wedding?.wedding_date || '');
  const [venue, setVenue] = useState(wedding?.venue_name || '');
  const [message, setMessage] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const templates = [
    { id: 0, name: 'Classic', icon: 'mail' as const, color: '#FF6B6B' },
    { id: 1, name: 'Modern', icon: 'sparkles' as const, color: '#4ECDC4' },
    { id: 2, name: 'Rustic', icon: 'leaf' as const, color: '#96CEB4' },
    { id: 3, name: 'Elegant', icon: 'diamond' as const, color: '#DDA0DD' },
  ];

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleGenerateLink = () => {
    const rsvpLink = `https://aisle.app/rsvp/${wedding?.id || 'demo'}`;
    setGeneratedLink(rsvpLink);
    Alert.alert(
      'RSVP Link Generated',
      rsvpLink,
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  const handleSendInvites = async () => {
    const rsvpLink = `https://aisle.app/rsvp/${wedding?.id || 'demo'}`;
    const subject = encodeURIComponent(`Wedding Invitation: ${coupleNames || 'Our Wedding'}`);
    const body = encodeURIComponent(`You're invited to our wedding!\n\nDate: ${weddingDate || 'TBD'}\nVenue: ${venue || 'TBD'}\n\nRSVP at: ${rsvpLink}\n\n${message ? `Message: ${message}\n\n` : ''}Please RSVP by ${rsvpDeadline || 'TBD'}`);
    
    try {
      await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
    } catch (error) {
      Alert.alert('Error', 'Could not open email app');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Digital Invites</Text>
        <Text style={styles.subtitle}>Create beautiful invitations for your guests</Text>
      </View>

      {/* Template Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Template</Text>
        <View style={styles.templatesGrid}>
          {templates.map((template) => (
            <Pressable
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate === template.id && styles.templateCardSelected,
                selectedTemplate === template.id && { borderColor: template.color }
              ]}
              onPress={() => setSelectedTemplate(template.id)}
            >
              <Ionicons name={template.icon as any} size={32} color={selectedTemplate === template.id ? template.color : appTheme.text} />
              <Text style={styles.templateName}>{template.name}</Text>
              {selectedTemplate === template.id && (
                <View style={[styles.checkBadge, { backgroundColor: template.color }]}>
                  <Ionicons name="checkmark" size={16} color={appTheme.text} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Invite Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Details</Text>

        <Text style={styles.label}>Couple Names</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Sarah & John"
          value={coupleNames}
          onChangeText={setCoupleNames}
        />

        <Text style={styles.label}>Wedding Date</Text>
        <TextInput
          style={styles.input}
          placeholder="Select date"
          value={weddingDate}
          onChangeText={setWeddingDate}
        />

        <Text style={styles.label}>Venue</Text>
        <TextInput
          style={styles.input}
          placeholder="Venue name and location"
          value={venue}
          onChangeText={setVenue}
        />

        <Text style={styles.label}>Personal Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add a personal message to your guests..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>RSVP Deadline</Text>
        <TextInput
          style={styles.input}
          placeholder="RSVP by date"
          value={rsvpDeadline}
          onChangeText={setRsvpDeadline}
        />
      </View>

      {/* Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name={templates[selectedTemplate].icon as any} size={32} color={appTheme.text} />
            <Text style={styles.previewTemplate}>{templates[selectedTemplate].name}</Text>
          </View>
          
          <View style={styles.previewContent}>
            <Text style={styles.previewCouple}>{coupleNames || 'Your Names'}</Text>
            <Text style={styles.previewInviteText}>request the pleasure of your company</Text>
            
            <View style={styles.previewDivider} />
            
            <Text style={styles.previewLabel}>Date</Text>
            <Text style={styles.previewValue}>{weddingDate || 'TBD'}</Text>
            
            <Text style={styles.previewLabel}>Venue</Text>
            <Text style={styles.previewValue}>{venue || 'TBD'}</Text>
            
            {message && (
              <>
                <View style={styles.previewDivider} />
                <Text style={styles.previewMessage}>{message}</Text>
              </>
            )}
            
            <View style={styles.previewDivider} />
            
            <Text style={styles.previewLabel}>RSVP by</Text>
            <Text style={styles.previewValue}>{rsvpDeadline || 'TBD'}</Text>
            
            <View style={styles.previewRsvpSection}>
              <Text style={styles.previewRsvpText}>Scan to RSVP</Text>
              <View style={styles.previewQrCode}>
                <Ionicons name="qr-code" size={48} color={appTheme.text} />
              </View>
            </View>
          </View>
        </View>

        <Pressable style={styles.previewButton} onPress={handlePreview}>
          <Ionicons name="eye" size={20} color={appTheme.text} />
          <Text style={styles.previewButtonText}>Full Preview</Text>
        </Pressable>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPreviewModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={appTheme.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Invite Preview</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.fullPreviewCard}>
              <View style={styles.fullPreviewHeader}>
                <Ionicons name={templates[selectedTemplate].icon as any} size={40} color={appTheme.text} />
                <Text style={styles.fullPreviewTemplate}>{templates[selectedTemplate].name} Template</Text>
              </View>
              
              <View style={styles.fullPreviewBody}>
                <Text style={styles.fullPreviewCouple}>{coupleNames || 'Your Names'}</Text>
                <Text style={styles.fullPreviewInviteText}>request the pleasure of your company</Text>
                <Text style={styles.fullPreviewInviteText}>at the celebration of their wedding</Text>
                
                <View style={styles.fullPreviewDivider} />
                
                <Text style={styles.fullPreviewLabel}>Date</Text>
                <Text style={styles.fullPreviewValue}>{weddingDate || 'To Be Determined'}</Text>
                
                <Text style={styles.fullPreviewLabel}>Venue</Text>
                <Text style={styles.fullPreviewValue}>{venue || 'To Be Determined'}</Text>
                
                {message && (
                  <>
                    <View style={styles.fullPreviewDivider} />
                    <Text style={styles.fullPreviewMessage}>{message}</Text>
                  </>
                )}
                
                <View style={styles.fullPreviewDivider} />
                
                <Text style={styles.fullPreviewLabel}>RSVP by</Text>
                <Text style={styles.fullPreviewValue}>{rsvpDeadline || 'To Be Determined'}</Text>
                
                <View style={styles.fullPreviewQrSection}>
                  <Text style={styles.fullPreviewQrText}>Scan to RSVP</Text>
                  <View style={styles.fullPreviewQrCode}>
                    <Ionicons name="qr-code" size={64} color={appTheme.text} />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Pressable 
              style={styles.modalButton} 
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.modalButtonText}>Close Preview</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={handleGenerateLink}>
          <Ionicons name="link" size={20} color={appTheme.text} />
          <Text style={styles.secondaryButtonText}>Generate RSVP Link</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handleSendInvites}>
          <Ionicons name="send" size={20} color={appTheme.text} />
          <Text style={styles.primaryButtonText}>Send Invites</Text>
        </Pressable>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={appTheme.textSecondary} />
        <Text style={styles.infoText}>
          Guests can RSVP without the app using the generated link. The link can be shared via email, text, or social media.
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
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  templateCardSelected: {
    borderWidth: 2,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.textSecondary,
    marginBottom: 8,
    marginTop: 16,
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
  previewCard: {
    backgroundColor: appTheme.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border.default,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.border.default,
  },
  previewTemplate: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.textSecondary,
  },
  previewContent: {
    padding: 24,
    alignItems: 'center',
  },
  previewCouple: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewInviteText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewDivider: {
    width: '100%',
    height: 1,
    backgroundColor: appTheme.colors.border.default,
    marginVertical: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: appTheme.textDisabled,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 16,
  },
  previewMessage: {
    fontSize: 14,
    color: appTheme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  previewRsvpSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewRsvpText: {
    fontSize: 12,
    color: appTheme.textDisabled,
    marginBottom: 8,
  },
  previewQrCode: {
    padding: 12,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: appTheme.surface,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  fullPreviewCard: {
    backgroundColor: appTheme.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border.default,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: appTheme.colors.surface.raised,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.border.default,
  },
  fullPreviewIcon: {
    fontSize: 32,
  },
  fullPreviewTemplate: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.textSecondary,
  },
  fullPreviewBody: {
    padding: 32,
    alignItems: 'center',
  },
  fullPreviewCouple: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  fullPreviewInviteText: {
    fontSize: 16,
    color: appTheme.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fullPreviewDivider: {
    width: '100%',
    height: 1,
    backgroundColor: appTheme.colors.border.default,
    marginVertical: 20,
  },
  fullPreviewLabel: {
    fontSize: 14,
    color: appTheme.textDisabled,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fullPreviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 20,
  },
  fullPreviewMessage: {
    fontSize: 16,
    color: appTheme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  fullPreviewQrSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  fullPreviewQrText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    marginBottom: 12,
  },
  fullPreviewQrCode: {
    padding: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  modalButton: {
    backgroundColor: appTheme.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
  },
});
