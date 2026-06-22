import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { useGuestStore } from '../../store/guestStore';
import { theme } from '../../config/theme';
import { usePerformanceTracking } from '../../lib/hooks/usePerformanceTracking';

export default function GuestsScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { guests } = useGuestStore();

  // Track screen load performance
  usePerformanceTracking('guests');

  const filters = [
    { id: 'all', label: 'All', count: guests.length },
    { id: 'attending', label: 'Attending', count: guests.filter(g => g.rsvp_status === 'attending').length },
    { id: 'declined', label: 'Declined', count: guests.filter(g => g.rsvp_status === 'declined').length },
    { id: 'pending', label: 'Pending', count: guests.filter(g => g.rsvp_status === 'invited' || g.rsvp_status === 'opened' || g.rsvp_status === 'no_response').length },
  ];

  const filteredGuests = guests.filter(guest => {
    const matchesFilter = selectedFilter === 'all' || guest.rsvp_status === selectedFilter;
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRSVPColor = (status: string) => {
    switch (status) {
      case 'attending':
        return theme.success;
      case 'declined':
        return theme.error;
      case 'invited':
      case 'opened':
      case 'no_response':
        return theme.warning;
      default:
        return theme.textDisabled;
    }
  };

  const getRSVPLabel = (status: string) => {
    switch (status) {
      case 'attending':
        return 'Attending';
      case 'declined':
        return 'Declined';
      case 'invited':
        return 'Invited';
      case 'opened':
        return 'Opened';
      case 'no_response':
        return 'No Response';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Guest List</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/invite-builder')}>
            <Ionicons name="mail" size={24} color={theme.text} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/seating')}>
            <Ionicons name="grid" size={24} color={theme.text} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/add-guest')}>
            <Ionicons name="add" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filters[0].count}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filters[1].count}</Text>
          <Text style={styles.statLabel}>Attending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filters[2].count}</Text>
          <Text style={styles.statLabel}>Declined</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filters[3].count}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.textDisabled} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextSelected,
              ]}
            >
              {filter.label} ({filter.count})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Guest List */}
      <ScrollView style={styles.guestList}>
        {filteredGuests.length > 0 ? (
          filteredGuests.map((guest) => (
            <Pressable 
              key={guest.id} 
              style={styles.guestCard}
              onPress={() => router.push({ pathname: '/guest-detail', params: { id: guest.id } })}
            >
              <View style={styles.guestAvatar}>
                <Text style={styles.guestInitials}>
                  {guest.name.split(' ').map((n: string) => n[0]).join('')}
                </Text>
              </View>
              
              <View style={styles.guestContent}>
                <Text style={styles.guestName}>{guest.name}</Text>
                <View style={styles.guestMeta}>
                  <Text style={styles.guestGroup}>{guest.group_tag || 'Guest'}</Text>
                  {guest.dietary_needs && (
                    <>
                      <Text style={styles.guestMetaSeparator}>•</Text>
                      <Text style={styles.guestDietary}>{guest.dietary_needs}</Text>
                    </>
                  )}
                </View>
                {guest.plus_one && (
                  <Text style={styles.plusOneText}>+1 {guest.plus_one_name}</Text>
                )}
              </View>
              
              <View style={styles.rsvpBadge}>
                <View style={[styles.rsvpDot, { backgroundColor: getRSVPColor(guest.rsvp_status) }]} />
                <Text style={[styles.rsvpText, { color: getRSVPColor(guest.rsvp_status) }]}>
                  {getRSVPLabel(guest.rsvp_status)}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No guests found</Text>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.actionButton}>
          <Ionicons name="mail" size={20} color={theme.text} />
          <Text style={styles.actionButtonText}>Send Reminders</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Ionicons name="download" size={20} color={theme.text} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            Export List
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: theme.typography.heading.fontSize,
    fontWeight: theme.typography.heading.fontWeight,
    fontFamily: theme.typography.heading.fontFamily,
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.stat.fontSize,
    fontWeight: theme.typography.stat.fontWeight,
    fontFamily: theme.typography.stat.fontFamily,
    color: theme.text,
  },
  statLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface.raised,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: theme.surface,
  },
  filterChipText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
  },
  filterChipTextSelected: {
    color: theme.text,
  },
  guestList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guestInitials: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
  },
  guestContent: {
    flex: 1,
  },
  guestName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.text,
    marginBottom: 4,
  },
  guestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestGroup: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  guestMetaSeparator: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textDisabled,
    marginHorizontal: 8,
  },
  guestDietary: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.warning,
  },
  plusOneText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textSecondary,
    marginTop: 4,
  },
  rsvpBadge: {
    alignItems: 'flex-end',
  },
  rsvpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  rsvpText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface.raised,
  },
  actionButtonText: {
    color: theme.text,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    fontFamily: theme.typography.button.fontFamily,
    marginLeft: 8,
  },
  actionButtonTextSecondary: {
    color: theme.text,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.textDisabled,
    textAlign: 'center',
    padding: 32,
  },
});
