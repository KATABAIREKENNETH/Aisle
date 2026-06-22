import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase/client';

interface WeddingWithDetails {
  id: string;
  wedding_date: string;
  wedding_location: string;
  venue_name: string;
  budget: number;
  guest_count: number;
  couple_name?: string;
  couple_email?: string;
  partner_name?: string;
  guest_count_actual: number;
  task_count: number;
  completed_task_count: number;
}

export default function WeddingManagement() {
  const [weddings, setWeddings] = useState<WeddingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWedding, setSelectedWedding] = useState<WeddingWithDetails | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedWedding, setEditedWedding] = useState<Partial<WeddingWithDetails>>({});

  useEffect(() => {
    loadWeddings();
  }, []);

  async function loadWeddings() {
    try {
      const { data: weddingsData, error } = await supabase
        .from('weddings')
        .select('*')
        .order('wedding_date', { ascending: true });

      if (error) throw error;

      const weddingsWithDetails = await Promise.all(
        (weddingsData || []).map(async (wedding) => {
          // Get couple info
          const { data: couple } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', wedding.couple_id)
            .single();

          // Get partner info
          let partnerName = null;
          if (wedding.partner_id) {
            const { data: partner } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', wedding.partner_id)
              .single();
            partnerName = partner?.full_name;
          }

          // Get actual guest count
          const { count: guestCount } = await supabase
            .from('guests')
            .select('*', { count: 'exact', head: true })
            .eq('wedding_id', wedding.id);

          // Get task counts
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('wedding_id', wedding.id);

          const { count: completedTaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('wedding_id', wedding.id)
            .eq('status', 'completed');

          return {
            ...wedding,
            couple_name: couple?.full_name,
            couple_email: couple?.email,
            partner_name: partnerName,
            guest_count_actual: guestCount || 0,
            task_count: taskCount || 0,
            completed_task_count: completedTaskCount || 0,
          };
        })
      );

      setWeddings(weddingsWithDetails);
    } catch (error) {
      console.error('Error loading weddings:', error);
    } finally {
      setLoading(false);
    }
  }

  function getWeddingStatus(wedding: WeddingWithDetails): string {
    const today = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    
    if (weddingDate < today) {
      return 'Completed';
    } else if (weddingDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      const daysUntil = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30) {
        return `${daysUntil} days`;
      }
      return 'Upcoming';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'Completed':
        return '#96CEB4';
      case 'Today':
        return '#FF6B6B';
      case 'Upcoming':
        return '#45B7D1';
      default:
        return '#FFEAA7';
    }
  }

  function openWeddingDetails(wedding: WeddingWithDetails) {
    setSelectedWedding(wedding);
    setEditedWedding(wedding);
    setDetailModalVisible(true);
    setEditMode(false);
  }

  function startEditMode() {
    setEditMode(true);
    setEditedWedding(selectedWedding || {});
  }

  async function saveWeddingChanges() {
    if (!selectedWedding || !editedWedding) return;

    try {
      const { error } = await supabase
        .from('weddings')
        .update({
          wedding_date: editedWedding.wedding_date,
          wedding_location: editedWedding.wedding_location,
          venue_name: editedWedding.venue_name,
          budget: editedWedding.budget,
          guest_count: editedWedding.guest_count,
        })
        .eq('id', selectedWedding.id);

      if (error) throw error;

      await loadWeddings();
      setEditMode(false);
      setSelectedWedding({ ...selectedWedding, ...editedWedding });
      alert('Wedding updated successfully');
    } catch (error) {
      console.error('Error updating wedding:', error);
      alert('Failed to update wedding');
    }
  }

  function cancelEdit() {
    setEditMode(false);
    setEditedWedding(selectedWedding || {});
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading weddings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Wedding Management</Text>
          <Text style={styles.subtitle}>{weddings.length} total weddings</Text>
        </View>

        {weddings.length === 0 ? (
          <Text style={styles.emptyText}>No weddings found</Text>
        ) : (
          weddings.map((wedding) => {
            const status = getWeddingStatus(wedding);
            const taskProgress = wedding.task_count > 0 
              ? Math.round((wedding.completed_task_count / wedding.task_count) * 100) 
              : 0;

            return (
              <TouchableOpacity
                key={wedding.id}
                style={styles.weddingCard}
                onPress={() => openWeddingDetails(wedding)}
              >
                <View style={styles.weddingHeader}>
                  <View>
                    <Text style={styles.weddingDate}>
                      {new Date(wedding.wedding_date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.weddingLocation}>
                      {wedding.venue_name || wedding.wedding_location || 'Location TBD'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                <View style={styles.weddingDetails}>
                  <DetailItem label="Couple" value={wedding.couple_name || 'Unknown'} />
                  {wedding.partner_name && (
                    <DetailItem label="Partner" value={wedding.partner_name} />
                  )}
                  <DetailItem label="Budget" value={`UGX ${(wedding.budget || 0).toLocaleString()}`} />
                  <DetailItem 
                    label="Guests" 
                    value={`${wedding.guest_count_actual} / ${wedding.guest_count || 0}`} 
                  />
                </View>

                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Task Progress</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${taskProgress}%` }]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {wedding.completed_task_count} / {wedding.task_count} tasks ({taskProgress}%)
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedWedding(null);
          setEditMode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Wedding Details' : 'Wedding Details'}
            </Text>
            {selectedWedding && (
              <ScrollView style={styles.modalScrollView}>
                {editMode ? (
                  <View style={styles.editForm}>
                    <EditField
                      label="Wedding Date"
                      value={editedWedding.wedding_date}
                      onChangeText={(text) => setEditedWedding({ ...editedWedding, wedding_date: text })}
                    />
                    <EditField
                      label="Location"
                      value={editedWedding.wedding_location}
                      onChangeText={(text) => setEditedWedding({ ...editedWedding, wedding_location: text })}
                    />
                    <EditField
                      label="Venue Name"
                      value={editedWedding.venue_name}
                      onChangeText={(text) => setEditedWedding({ ...editedWedding, venue_name: text })}
                    />
                    <EditField
                      label="Budget"
                      value={editedWedding.budget?.toString()}
                      onChangeText={(text) => setEditedWedding({ ...editedWedding, budget: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                    />
                    <EditField
                      label="Guest Count"
                      value={editedWedding.guest_count?.toString()}
                      onChangeText={(text) => setEditedWedding({ ...editedWedding, guest_count: parseInt(text) || 0 })}
                      keyboardType="numeric"
                    />
                  </View>
                ) : (
                  <View style={styles.detailForm}>
                    <DetailItem label="Wedding Date" value={new Date(selectedWedding.wedding_date).toLocaleDateString()} />
                    <DetailItem label="Location" value={selectedWedding.wedding_location || 'Not set'} />
                    <DetailItem label="Venue Name" value={selectedWedding.venue_name || 'Not set'} />
                    <DetailItem label="Budget" value={`UGX ${(selectedWedding.budget || 0).toLocaleString()}`} />
                    <DetailItem label="Guest Count" value={selectedWedding.guest_count?.toString() || '0'} />
                    <DetailItem label="Couple" value={selectedWedding.couple_name || 'Unknown'} />
                    {selectedWedding.partner_name && (
                      <DetailItem label="Partner" value={selectedWedding.partner_name} />
                    )}
                    <DetailItem label="Couple Email" value={selectedWedding.couple_email || 'Not set'} />
                    <DetailItem label="Actual Guests" value={selectedWedding.guest_count_actual.toString()} />
                    <DetailItem label="Tasks" value={`${selectedWedding.completed_task_count}/${selectedWedding.task_count}`} />
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              {editMode ? (
                <>
                  <TouchableOpacity style={styles.modalButton} onPress={cancelEdit}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveWeddingChanges}>
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.modalButton} onPress={() => setDetailModalVisible(false)}>
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.editButton]} onPress={startEditMode}>
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditField({ 
  label, 
  value, 
  onChangeText, 
  keyboardType = 'default' 
}: { 
  label: string; 
  value: string | undefined; 
  onChangeText: (text: string) => void; 
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  weddingCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weddingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  weddingDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  weddingLocation: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  weddingDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  progressSection: {
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentLarge: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
    marginVertical: 15,
  },
  detailForm: {
    paddingVertical: 10,
  },
  editForm: {
    paddingVertical: 10,
  },
  editField: {
    marginBottom: 15,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  editButton: {
    backgroundColor: '#1a1a2e',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
