import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStore } from '../../store/guestStore';
import { updateGuest } from '../../lib/api/guests';
import { theme as appTheme } from '../../config/theme';

export default function SeatingScreen() {
  const { guests, updateGuest: updateStoreGuest } = useGuestStore();

  // Derive unique table names from guests' table_number field
  const tableNames = useMemo(() => {
    const names = new Set<string>();
    guests.forEach((g) => {
      if (g.table_number) names.add(g.table_number);
    });
    return Array.from(names).sort();
  }, [guests]);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [addingTable, setAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [saving, setSaving] = useState(false);

  // Guests per table
  const guestsAtTable = (tableName: string) =>
    guests.filter((g) => g.table_number === tableName);

  const unassignedGuests = guests.filter((g) => !g.table_number);

  const totalSeated = guests.filter((g) => !!g.table_number).length;
  const totalSeats = guests.reduce((sum, g) => sum + (g.table_number ? (g.plus_one ? 2 : 1) : 0), 0);

  const handleAddTable = () => {
    const name = newTableName.trim();
    if (!name) {
      Alert.alert('Name Required', 'Please enter a table name.');
      return;
    }
    if (tableNames.includes(name)) {
      Alert.alert('Already Exists', `"${name}" already exists.`);
      return;
    }
    setSelectedTable(name);
    setNewTableName('');
    setAddingTable(false);
  };

  const handleAssignGuest = async (guestId: string) => {
    if (!selectedTable) return;
    try {
      setSaving(true);
      const updated = await updateGuest(guestId, { table_number: selectedTable });
      updateStoreGuest(guestId, updated);
    } catch {
      Alert.alert('Error', 'Failed to assign guest to table.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      setSaving(true);
      const updated = await updateGuest(guestId, { table_number: null });
      updateStoreGuest(guestId, updated);
    } catch {
      Alert.alert('Error', 'Failed to remove guest from table.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = (tableName: string) => {
    const seated = guestsAtTable(tableName);
    const seatCount = seated.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0);
    Alert.alert(
      'Delete Table',
      seatCount > 0
        ? `This will unassign ${seatCount} seat(s). Continue?`
        : 'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await Promise.all(
                seated.map((g) =>
                  updateGuest(g.id, { table_number: null }).then((updated) =>
                    updateStoreGuest(g.id, updated)
                  )
                )
              );
              if (selectedTable === tableName) setSelectedTable(null);
            } catch {
              Alert.alert('Error', 'Failed to remove all guests from table.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const selectedTableGuests = selectedTable ? guestsAtTable(selectedTable) : [];
  const availableToAdd = unassignedGuests; // guests not at any table

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seating Chart</Text>
        <Text style={styles.headerSubtitle}>
          {totalSeats} of {guests.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0)} seats assigned
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tableNames.length}</Text>
          <Text style={styles.statLabel}>Tables</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSeats}</Text>
          <Text style={styles.statLabel}>Seats</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{unassignedGuests.length}</Text>
          <Text style={styles.statLabel}>Unassigned</Text>
        </View>
      </View>

      {/* Add Table */}
      <View style={styles.addSection}>
        {addingTable ? (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Table 1, Sweetheart Table"
              placeholderTextColor={appTheme.textDisabled}
              value={newTableName}
              onChangeText={setNewTableName}
              autoFocus
            />
            <View style={styles.addFormActions}>
              <Pressable style={styles.confirmBtn} onPress={handleAddTable}>
                <Ionicons name="checkmark" size={18} color={appTheme.text} />
                <Text style={styles.confirmBtnText}>Add</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => { setAddingTable(false); setNewTableName(''); }}>
                <Ionicons name="close" size={18} color={appTheme.textSecondary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.addTableBtn} onPress={() => setAddingTable(true)}>
            <Ionicons name="add-circle" size={20} color={appTheme.text} />
            <Text style={styles.addTableBtnText}>Add Table</Text>
          </Pressable>
        )}
      </View>

      {saving && (
        <View style={styles.savingBanner}>
          <ActivityIndicator size="small" color={appTheme.text} />
          <Text style={styles.savingText}>Saving…</Text>
        </View>
      )}

      {/* Tables List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tables</Text>
        {tableNames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={48} color={appTheme.textDisabled} />
            <Text style={styles.emptyText}>No tables yet. Add one above.</Text>
          </View>
        ) : (
          <View style={styles.tablesGrid}>
            {tableNames.map((name) => {
              const tableGuests = guestsAtTable(name);
              const seatCount = tableGuests.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0);
              const isSelected = selectedTable === name;
              return (
                <Pressable
                  key={name}
                  style={[styles.tableCard, isSelected && styles.tableCardSelected]}
                  onPress={() => setSelectedTable(isSelected ? null : name)}
                >
                  <View style={styles.tableCardHeader}>
                    <Text style={styles.tableName}>{name}</Text>
                    <Pressable onPress={() => handleDeleteTable(name)}>
                      <Ionicons name="close-circle" size={18} color={appTheme.error} />
                    </Pressable>
                  </View>
                  <Text style={styles.tableCount}>{seatCount} seat{seatCount !== 1 ? 's' : ''}</Text>
                  <View style={styles.tableDots}>
                    {tableGuests.slice(0, 8).map((g) => (
                      <View key={g.id} style={styles.tableDotFilled} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Selected Table Detail */}
      {selectedTable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{selectedTable}</Text>

          {/* Seated guests */}
          <Text style={styles.subTitle}>Seated Guests</Text>
          {selectedTableGuests.length === 0 ? (
            <Text style={styles.emptyText}>No guests assigned yet.</Text>
          ) : (
            selectedTableGuests.map((g) => (
              <View key={g.id} style={styles.guestRow}>
                <View>
                  <Text style={styles.guestName}>{g.name}</Text>
                  {g.plus_one_name ? (
                    <Text style={styles.plusOneLabel}>+ {g.plus_one_name}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => handleRemoveGuest(g.id)}>
                  <Ionicons name="remove-circle" size={22} color={appTheme.error} />
                </Pressable>
              </View>
            ))
          )}

          {/* Unassigned guests to add */}
          {availableToAdd.length > 0 && (
            <>
              <Text style={[styles.subTitle, { marginTop: 20 }]}>Add Guests</Text>
              {availableToAdd.map((g) => (
                <Pressable key={g.id} style={styles.guestRow} onPress={() => handleAssignGuest(g.id)}>
                  <View>
                    <Text style={styles.guestName}>{g.name}</Text>
                    {g.plus_one_name ? (
                      <Text style={styles.plusOneLabel}>+ {g.plus_one_name}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="add-circle" size={22} color={appTheme.success} />
                </Pressable>
              ))}
            </>
          )}
        </View>
      )}

      {/* Unassigned list */}
      {unassignedGuests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unassigned Guests</Text>
          {unassignedGuests.map((g) => (
            <View key={g.id} style={styles.unassignedRow}>
              <View>
                <Text style={styles.guestName}>{g.name}</Text>
                {g.plus_one_name ? (
                  <Text style={styles.plusOneLabel}>+ {g.plus_one_name}</Text>
                ) : null}
              </View>
              <Text style={styles.rsvpLabel}>{g.rsvp_status}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.background },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: appTheme.text, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: appTheme.textSecondary },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: appTheme.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: appTheme.textSecondary },
  addSection: { paddingHorizontal: 16, paddingBottom: 8 },
  addForm: { gap: 10 },
  addFormActions: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: appTheme.colors.surface.raised,
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    color: appTheme.text,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: appTheme.surface,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmBtnText: { color: appTheme.text, fontWeight: '600', fontSize: 14 },
  cancelBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 12,
  },
  addTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appTheme.surface,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addTableBtnText: { color: appTheme.text, fontWeight: '600', fontSize: 15 },
  savingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  savingText: { fontSize: 13, color: appTheme.textSecondary },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: appTheme.text, marginBottom: 16 },
  subTitle: { fontSize: 14, fontWeight: '600', color: appTheme.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    width: '48%',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableCardSelected: { borderColor: appTheme.surface },
  tableCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tableName: { fontSize: 15, fontWeight: '700', color: appTheme.text },
  tableCount: { fontSize: 12, color: appTheme.textSecondary, marginBottom: 8 },
  tableDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tableDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: appTheme.success },
  emptyState: { alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { fontSize: 14, color: appTheme.textDisabled, fontStyle: 'italic' },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.raised,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  guestName: { fontSize: 15, fontWeight: '600', color: appTheme.text },
  plusOneLabel: { fontSize: 12, color: appTheme.textSecondary, marginTop: 2 },
  unassignedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface.overlay,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rsvpLabel: { fontSize: 12, color: appTheme.textDisabled },
});
