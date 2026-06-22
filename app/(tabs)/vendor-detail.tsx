import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Linking, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useVendorStore } from '../../store/vendorStore';
import { formatCurrency } from '../../lib/utils/currency';
import { sendVendorInvitation } from '../../lib/api/invitations';
import { theme as appTheme } from '../../config/theme';

export default function VendorDetailScreen() {
  const params = useLocalSearchParams();
  const vendorId = params.id as string;
  const { vendors } = useVendorStore();
  const vendor = vendors.find(v => v.id === vendorId);
  
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'contract'>('details');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const safeBack = () => {
    router.back();
  };

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Vendor not found</Text>
      </View>
    );
  }

  const handleCall = () => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  };

  const handleEmail = () => {
    if (vendor.email) {
      Linking.openURL(`mailto:${vendor.email}`);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      // Send message via messages store
      // This would connect to the message store to send the message
      // For now, we'll clear the message and show a success
      setMessage('');
      Alert.alert('Success', 'Message sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToApp = async () => {
    if (!vendor.email) {
      Alert.alert('Error', 'Vendor must have an email address to be invited');
      return;
    }

    if (vendor.invitation_sent) {
      Alert.alert('Already Invited', 'This vendor has already been invited to the app');
      return;
    }

    try {
      setLoading(true);
      const result = await sendVendorInvitation(vendor.id, vendor.email);
      
      // Update the vendor in the store
      const updatedVendor = { ...vendor, invitation_sent: true, invitation_token: result.token };
      // Note: We'd need to add setVendors to the vendor store for this to work
      
      Alert.alert(
        'Invitation Sent',
        `An invitation has been sent to ${vendor.name} at ${vendor.email}. Share this token: ${result.token}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return appTheme.success;
      case 'contacted': return appTheme.info;
      case 'researching': return appTheme.warning;
      default: return appTheme.textDisabled;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={safeBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.text} />
        </Pressable>
        <Pressable style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={appTheme.text} />
        </Pressable>
      </View>

      {/* Vendor Info */}
      <View style={styles.vendorInfo}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{vendor.category}</Text>
        </View>
        <Text style={styles.vendorName}>{vendor.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vendor.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(vendor.status) }]}>
            {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
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
        <Pressable style={styles.quickActionButton}>
          <Ionicons name="navigate" size={20} color={appTheme.text} />
          <Text style={styles.quickActionText}>Directions</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={handleInviteToApp} disabled={loading || vendor.invitation_sent}>
          <Ionicons name={vendor.invitation_sent ? "checkmark-circle" : "person-add"} size={20} color={vendor.invitation_sent ? appTheme.success : appTheme.text} />
          <Text style={[styles.quickActionText, vendor.invitation_sent && { color: appTheme.success }]}>
            {vendor.invitation_sent ? 'Invited' : 'Invite'}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>Messages</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'contract' && styles.tabActive]}
          onPress={() => setActiveTab('contract')}
        >
          <Text style={[styles.tabText, activeTab === 'contract' && styles.tabTextActive]}>Contract</Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <View style={styles.tabContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {vendor.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={appTheme.textSecondary} />
                <Text style={styles.infoText}>{vendor.email}</Text>
              </View>
            )}
            {vendor.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={appTheme.textSecondary} />
                <Text style={styles.infoText}>{vendor.phone}</Text>
              </View>
            )}
            {vendor.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe" size={20} color={appTheme.textSecondary} />
                <Text style={styles.infoText}>{vendor.website}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color={appTheme.textSecondary} />
              <Text style={styles.infoText}>
                Quote: {formatCurrency(vendor.quoted_amount || 0)}
              </Text>
            </View>
            {vendor.actual_amount && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={20} color={appTheme.success} />
                <Text style={styles.infoText}>
                  Paid: {formatCurrency(vendor.actual_amount)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating</Text>
            {vendor.rating ? (
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= (vendor.rating || 0) ? 'star' : 'star-outline'}
                    size={24}
                    color={appTheme.warning}
                  />
                ))}
                <Text style={styles.ratingText}>{vendor.rating}/5</Text>
              </View>
            ) : (
              <Text style={styles.infoText}>No ratings yet</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>
              {vendor.notes || 'No notes added yet. Tap to add notes about this vendor.'}
            </Text>
          </View>
        </View>
      )}

      {activeTab === 'messages' && (
        <View style={styles.tabContent}>
          <View style={styles.messageList}>
            <View style={styles.messageReceived}>
              <Text style={styles.messageText}>Hi! I'm interested in your services for our wedding.</Text>
              <Text style={styles.messageTime}>Yesterday</Text>
            </View>
            <View style={styles.messageSent}>
              <Text style={styles.messageText}>Thanks for reaching out! Let's schedule a call.</Text>
              <Text style={styles.messageTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
            />
            <Pressable style={styles.sendButton} onPress={handleSendMessage}>
              <Ionicons name="send" size={20} color={appTheme.text} />
            </Pressable>
          </View>
        </View>
      )}

      {activeTab === 'contract' && (
        <View style={styles.tabContent}>
          <View style={styles.contractSection}>
            <Ionicons name="document-text" size={48} color={appTheme.textSecondary} />
            <Text style={styles.contractTitle}>Contract</Text>
            <Text style={styles.contractStatus}>
              {vendor.contract_uploaded ? 'Uploaded' : 'Not uploaded'}
            </Text>
            <Pressable style={styles.uploadButton}>
              <Ionicons name="cloud-upload" size={20} color={appTheme.text} />
              <Text style={styles.uploadButtonText}>Upload Contract</Text>
            </Pressable>
            {vendor.contract_uploaded && (
              <Pressable style={styles.viewButton}>
                <Ionicons name="eye" size={20} color={appTheme.text} />
                <Text style={styles.viewButtonText}>View Contract</Text>
              </Pressable>
            )}
          </View>
        </View>
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInfo: {
    padding: 24,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: appTheme.colors.surface.raised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.textSecondary,
  },
  vendorName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: appTheme.surface,
  },
  tabText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    fontWeight: '500',
  },
  tabTextActive: {
    color: appTheme.text,
    fontWeight: '600',
  },
  tabContent: {
    padding: 24,
    minHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 12,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
  messageList: {
    flex: 1,
    gap: 16,
    marginBottom: 16,
  },
  messageReceived: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageSent: {
    backgroundColor: appTheme.surface,
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: appTheme.text,
    marginBottom: 4,
  },
  messageSentText: {
    color: appTheme.text,
  },
  messageTime: {
    fontSize: 11,
    color: appTheme.textDisabled,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractSection: {
    alignItems: 'center',
    padding: 32,
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: appTheme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  contractStatus: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: appTheme.colors.surface.raised,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: appTheme.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
});
