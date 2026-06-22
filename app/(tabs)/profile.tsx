import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWeddingStore } from '../../store/weddingStore';
import { updateWedding } from '../../lib/api/weddings';
import { formatCurrency } from '../../lib/utils/currency';
import { theme as appTheme } from '../../config/theme';
import CustomDatePicker from '../../components/CustomDatePicker';

const BG = '#F2F2F7';
const CARD_BG = '#FFFFFF';
const SEPARATOR = '#E5E5EA';
const LABEL_COLOR = '#6C6C70';
const ROW_TEXT = '#1C1C1E';
const ICON_BG = '#EAE1ED';

export default function ProfileScreen() {
  const { user, setUser, setSession, logout } = useAuthStore();
  const { wedding, setWedding } = useWeddingStore();

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingWedding, setEditingWedding] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [name, setName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [weddingDate, setWeddingDate] = useState(wedding?.wedding_date || '');
  const [weddingLocation, setWeddingLocation] = useState(wedding?.wedding_location || '');
  const [venueName, setVenueName] = useState(wedding?.venue_name || '');
  const [weddingTheme, setWeddingTheme] = useState(wedding?.theme || '');
  const [weddingBudget, setWeddingBudget] = useState(wedding?.budget?.toString() || '');
  const [weddingGuestCount, setWeddingGuestCount] = useState(wedding?.guest_count?.toString() || '');

  const displayName = name || user?.email?.split('@')[0] || 'You';
  const initials = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await logout();
      // onAuthStateChange in _layout.tsx will handle the redirect automatically
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out. Please try again.');
    }
  };

  const handleSaveProfile = () => {
    setEditingProfile(false);
    setExpandedSection(null);
  };

  const handleSaveWedding = async () => {
    if (!wedding) return;
    try {
      const updated = await updateWedding(wedding.id, {
        weddingDate,
        weddingLocation,
        venueName,
        theme: weddingTheme,
        budget: weddingBudget,
        guestCount: weddingGuestCount,
      });
      setWedding(updated);
      setEditingWedding(false);
      setExpandedSection(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update wedding details');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleInvitePartner = async () => {
    try {
      const inviteCode = wedding?.id?.substring(0, 8).toUpperCase() || 'AISLE-INVITE';
      await Share.share({
        message: `Join me in planning our wedding on Aisle! Use my invite code: ${inviteCode}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable style={styles.headerIconBtn}>
          <Ionicons name="search" size={22} color={appTheme.text} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>You</Text>
        <Pressable style={styles.headerIconBtn}>
          <Ionicons name="qr-code" size={22} color={appTheme.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Pressable style={styles.nameRow} onPress={() => toggleSection('profile')}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Ionicons
              name={expandedSection === 'profile' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={LABEL_COLOR}
            />
          </Pressable>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Card 1: Account Details */}
        <Text style={styles.cardLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          {/* Profile Row */}
          <Pressable
            style={styles.cardRow}
            onPress={() => { toggleSection('profile'); setEditingProfile(true); }}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#B5005A' }]}>
              <Ionicons name="person" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>

          {expandedSection === 'profile' && (
            <View style={styles.expandedContent}>
              <Text style={styles.fieldLabel}>Name</Text>
              <View style={styles.fieldInputWithIcon}>
                <Ionicons name="person-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                <TextInput
                  style={styles.fieldInputWithPadding}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={LABEL_COLOR}
                />
              </View>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.fieldInputWithIcon}>
                <Ionicons name="mail-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                <TextInput
                  style={[styles.fieldInputWithPadding, { color: LABEL_COLOR }]}
                  value={email}
                  editable={false}
                  placeholder="Your email"
                  placeholderTextColor={LABEL_COLOR}
                />
              </View>
              <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.separator} />

          {/* Wedding Details Row */}
          <Pressable
            style={styles.cardRow}
            onPress={() => { toggleSection('wedding'); setEditingWedding(!editingWedding); }}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#D0002E' }]}>
              <Ionicons name="heart" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Wedding Details</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>

          {expandedSection === 'wedding' && (
            <View style={styles.expandedContent}>
              {wedding ? (
                editingWedding ? (
                  <>
                    <Text style={styles.fieldLabel}>Wedding Date</Text>
                    <CustomDatePicker date={weddingDate} onDateChange={setWeddingDate} />
                    <Text style={styles.fieldLabel}>Location</Text>
                    <View style={styles.fieldInputWithIcon}>
                      <Ionicons name="location-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                      <TextInput style={styles.fieldInputWithPadding} value={weddingLocation} onChangeText={setWeddingLocation} placeholder="City, State or Venue Address" placeholderTextColor={LABEL_COLOR} />
                    </View>
                    <Text style={styles.fieldLabel}>Venue Name</Text>
                    <View style={styles.fieldInputWithIcon}>
                      <Ionicons name="business-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                      <TextInput style={styles.fieldInputWithPadding} value={venueName} onChangeText={setVenueName} placeholder="Venue name" placeholderTextColor={LABEL_COLOR} />
                    </View>
                    <Text style={styles.fieldLabel}>Theme</Text>
                    <View style={styles.fieldInputWithIcon}>
                      <Ionicons name="color-palette-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                      <TextInput style={styles.fieldInputWithPadding} value={weddingTheme} onChangeText={setWeddingTheme} placeholder="Wedding theme" placeholderTextColor={LABEL_COLOR} />
                    </View>
                    <Text style={styles.fieldLabel}>Budget</Text>
                    <View style={styles.fieldInputWithIcon}>
                      <Ionicons name="cash-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                      <TextInput style={styles.fieldInputWithPadding} value={weddingBudget} onChangeText={setWeddingBudget} placeholder="Total budget" placeholderTextColor={LABEL_COLOR} keyboardType="numeric" />
                    </View>
                    <Text style={styles.fieldLabel}>Guest Count</Text>
                    <View style={styles.fieldInputWithIcon}>
                      <Ionicons name="people-outline" size={18} color={LABEL_COLOR} style={styles.fieldInputIcon} />
                      <TextInput style={styles.fieldInputWithPadding} value={weddingGuestCount} onChangeText={setWeddingGuestCount} placeholder="Number of guests" placeholderTextColor={LABEL_COLOR} keyboardType="numeric" />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Pressable style={[styles.saveBtn, { flex: 1, backgroundColor: SEPARATOR }]} onPress={() => { setEditingWedding(false); setExpandedSection(null); }}>
                        <Text style={[styles.saveBtnText, { color: appTheme.text }]}>Cancel</Text>
                      </Pressable>
                      <Pressable style={[styles.saveBtn, { flex: 1 }]} onPress={handleSaveWedding}>
                        <Text style={styles.saveBtnText}>Save</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Date</Text>
                        <Text style={styles.infoValue}>{wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString() : 'Not set'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Location</Text>
                        <Text style={styles.infoValue}>{wedding.wedding_location || 'Not set'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Venue</Text>
                        <Text style={styles.infoValue}>{wedding.venue_name || 'Not set'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Budget</Text>
                        <Text style={styles.infoValue}>{wedding.budget ? formatCurrency(wedding.budget) : 'Not set'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Guests</Text>
                        <Text style={styles.infoValue}>{wedding.guest_count || 'Not set'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.fieldLabel}>Theme</Text>
                        <Text style={styles.infoValue}>{wedding.theme || 'Not set'}</Text>
                      </View>
                    </View>
                    <Pressable style={[styles.saveBtn, { marginTop: 12, backgroundColor: SEPARATOR }]} onPress={() => setEditingWedding(true)}>
                      <Text style={[styles.saveBtnText, { color: appTheme.text }]}>Edit Details</Text>
                    </Pressable>
                  </>
                )
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ color: LABEL_COLOR, marginBottom: 12 }}>No wedding set up yet</Text>
                  <Pressable style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Complete Onboarding</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.separator} />

          {/* Partner Row */}
          <Pressable style={styles.cardRow} onPress={() => toggleSection('partner')}>
            <View style={[styles.rowIcon, { backgroundColor: '#005FCC' }]}>
              <Ionicons name="people" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Partner</Text>
            {wedding?.partner_id ? (
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>Joined</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
            )}
          </Pressable>

          {expandedSection === 'partner' && (
            <View style={styles.expandedContent}>
              {wedding?.partner_id ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.rowIcon, { backgroundColor: appTheme.primary }]}>
                    <Ionicons name="heart" size={18} color="#FFF" />
                  </View>
                  <Text style={{ color: appTheme.text, fontSize: 15, fontWeight: '600' }}>Partner Joined!</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: LABEL_COLOR, marginBottom: 12, fontSize: 14 }}>No partner invited yet</Text>
                  <Pressable style={[styles.saveBtn, { flexDirection: 'row', gap: 8, alignItems: 'center' }]} onPress={handleInvitePartner}>
                    <Ionicons name="mail" size={16} color="#FFF" />
                    <Text style={styles.saveBtnText}>Invite Partner</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Card 2: Settings */}
        <Text style={styles.cardLabel}>SETTINGS</Text>
        <View style={styles.card}>
          <Pressable style={styles.cardRow} onPress={() => router.push('/notifications')}>
            <View style={[styles.rowIcon, { backgroundColor: '#B45309' }]}>
              <Ionicons name="notifications" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.cardRow} onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon.')}>
            <View style={[styles.rowIcon, { backgroundColor: '#5C4E60' }]}>
              <Ionicons name="lock-closed" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.cardRow} onPress={() => Alert.alert('Terms & Privacy', 'Terms of service coming soon.')}>
            <View style={[styles.rowIcon, { backgroundColor: '#0077B6' }]}>
              <Ionicons name="document-text" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>
        </View>

        {/* Card 3: Support */}
        <Text style={styles.cardLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <Pressable style={styles.cardRow} onPress={() => Alert.alert('Need Help?', 'Help center coming soon.')}>
            <View style={[styles.rowIcon, { backgroundColor: '#0A7A4A' }]}>
              <Ionicons name="help-circle" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>Need Help?</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable style={styles.cardRow} onPress={() => Alert.alert('About', 'Version 1.0.0\nCreated by Aisle.')}>
            <View style={[styles.rowIcon, { backgroundColor: '#988B9C' }]}>
              <Ionicons name="information-circle" size={18} color="#FFF" />
            </View>
            <Text style={styles.rowText}>About Aisle</Text>
            <Ionicons name="chevron-forward" size={18} color={LABEL_COLOR} />
          </Pressable>
        </View>

        {/* Sign Out Card */}
        <View style={[styles.card, { marginBottom: 8 }]}>
          <Pressable
            style={styles.cardRow}
            onPress={handleSignOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#C0392B' }]}>
              <Ionicons name="log-out" size={18} color="#FFF" />
            </View>
            <Text style={[styles.rowText, { color: '#C0392B' }]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Aisle Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG,
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.semibold,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: appTheme.primary,
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: appTheme.text,
    fontFamily: appTheme.fonts.ui.semibold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.semibold,
  },
  emailText: {
    fontSize: 14,
    color: LABEL_COLOR,
    fontFamily: appTheme.fonts.ui.regular,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LABEL_COLOR,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: appTheme.fonts.ui.semibold,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.regular,
  },
  separator: {
    height: 1,
    backgroundColor: SEPARATOR,
    marginLeft: 60,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: SEPARATOR,
  },
  fieldLabel: {
    fontSize: 12,
    color: LABEL_COLOR,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: appTheme.fonts.ui.regular,
  },
  fieldInput: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.regular,
  },
  fieldInputWithIcon: {
    position: 'relative',
  },
  fieldInputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  fieldInputWithPadding: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingLeft: 44,
    paddingVertical: 10,
    fontSize: 15,
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.regular,
  },
  saveBtn: {
    backgroundColor: appTheme.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: appTheme.fonts.ui.semibold,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  infoItem: {
    width: '47%',
  },
  infoValue: {
    fontSize: 15,
    color: ROW_TEXT,
    fontFamily: appTheme.fonts.ui.regular,
  },
  partnerBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partnerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A7A4A',
  },
  version: {
    fontSize: 12,
    color: LABEL_COLOR,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: appTheme.fonts.ui.regular,
  },
});
