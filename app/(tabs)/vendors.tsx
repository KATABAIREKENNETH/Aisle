import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { useVendorStore } from '../../store/vendorStore';
import { formatCurrency } from '../../lib/utils/currency';
import { theme as appTheme } from '../../config/theme';

export default function VendorsScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { vendors } = useVendorStore();

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'booked', label: 'Booked' },
    { id: 'researching', label: 'Researching' },
    { id: 'contacted', label: 'Contacted' },
  ];

  const filteredVendors = vendors.filter(vendor => {
    const matchesFilter = selectedFilter === 'all' || vendor.status === selectedFilter;
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return appTheme.success;
      case 'contacted':
        return appTheme.info;
      case 'researching':
        return appTheme.warning;
      default:
        return appTheme.textDisabled;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'contacted':
        return 'Contacted';
      case 'researching':
        return 'Researching';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vendors</Text>
        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color={appTheme.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={appTheme.textDisabled} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
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
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Vendor List */}
      <ScrollView style={styles.vendorList}>
        {filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => (
            <Pressable 
              key={vendor.id} 
              style={styles.vendorCard}
              onPress={() => router.push(`/vendor-detail/${vendor.id}`)}
            >
              <View style={styles.vendorHeader}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.vendorCategory}>{vendor.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vendor.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(vendor.status) }]}>
                    {getStatusLabel(vendor.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.vendorDetails}>
                <View style={styles.vendorDetail}>
                  <Ionicons name="cash" size={16} color={appTheme.textSecondary} />
                  <Text style={styles.vendorDetailText}>
                    Quote: {formatCurrency(vendor.quoted_amount)}
                  </Text>
                </View>
                {vendor.actual_amount && (
                  <View style={styles.vendorDetail}>
                    <Ionicons name="checkmark-circle" size={16} color={appTheme.success} />
                    <Text style={styles.vendorDetailText}>
                      Paid: {formatCurrency(vendor.actual_amount)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.vendorActions}>
                <Pressable style={styles.vendorActionButton} onPress={(e) => e.stopPropagation()}>
                  <Ionicons name="chatbubble" size={18} color={appTheme.text} />
                  <Text style={styles.vendorActionText}>Message</Text>
                </Pressable>
                <Pressable style={styles.vendorActionButton} onPress={(e) => e.stopPropagation()}>
                  <Ionicons name="call" size={18} color={appTheme.text} />
                  <Text style={styles.vendorActionText}>Call</Text>
                </Pressable>
                {vendor.rating && (
                  <View style={styles.vendorRating}>
                    <Ionicons name="star" size={16} color={appTheme.warning} />
                    <Text style={styles.vendorRatingText}>{vendor.rating}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No vendors found</Text>
        )}
      </ScrollView>

      {/* Map View Button */}
      <Pressable style={styles.mapButton}>
        <Ionicons name="map" size={20} color={appTheme.text} />
        <Text style={styles.mapButtonText}>View on Map</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: appTheme.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface.raised,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: appTheme.surface,
  },
  filterChipText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: appTheme.text,
  },
  vendorList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  vendorCard: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appTheme.text,
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: appTheme.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vendorDetails: {
    marginBottom: 12,
  },
  vendorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorDetailText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    marginLeft: 8,
  },
  vendorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vendorActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorActionText: {
    fontSize: 14,
    color: appTheme.text,
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.text,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.surface,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
  },
  mapButtonText: {
    color: appTheme.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.textDisabled,
    textAlign: 'center',
    padding: 32,
  },
});
