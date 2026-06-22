import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { supabase } from '../../lib/supabase/client';
import type { User, UserRole } from '../../types';

interface UserWithProfile extends User {
  wedding_count?: number;
  is_banned?: boolean;
  banned_at?: string;
  ban_reason?: string;
  currency?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'delete' | 'ban' | 'unban' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('UGX');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get wedding count for each user
      const usersWithWeddingCount = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from('weddings')
            .select('*', { count: 'exact', head: true })
            .or(`couple_id.eq.${user.id},partner_id.eq.${user.id}`);
          return { ...user, wedding_count: count || 0 };
        })
      );

      setUsers(usersWithWeddingCount);
      setFilteredUsers(usersWithWeddingCount);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setRoleModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  }

  async function deleteUser(userId: string) {
    try {
      // Delete user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Profile will be deleted automatically via CASCADE
      await loadUsers();
      setActionModalVisible(false);
      setSelectedUser(null);
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  async function banUser(userId: string, reason: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: reason,
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setActionModalVisible(false);
      setSelectedUser(null);
      setBanReason('');
      alert('User banned successfully');
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    }
  }

  async function unbanUser(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          ban_reason: null,
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setActionModalVisible(false);
      setSelectedUser(null);
      alert('User unbanned successfully');
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user');
    }
  }

  async function loadUserActivities(userId: string) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserActivities(data || []);
      setActivityModalVisible(true);
    } catch (error) {
      console.error('Error loading user activities:', error);
      alert('Failed to load user activities');
    }
  }

  async function updateUserCurrency(userId: string, currency: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setCurrencyModalVisible(false);
      setSelectedUser(null);
      alert('User currency updated successfully');
    } catch (error) {
      console.error('Error updating user currency:', error);
      alert('Failed to update user currency');
    }
  }

  function handleAction(action: 'delete' | 'ban' | 'unban') {
    setActionType(action);
    setActionModalVisible(true);
  }

  function handleCurrencyChange(currency: string) {
    setSelectedCurrency(currency);
    if (selectedUser) {
      updateUserCurrency(selectedUser.id, currency);
    }
  }

  function confirmAction() {
    if (!selectedUser || !actionType) return;

    switch (actionType) {
      case 'delete':
        deleteUser(selectedUser.id);
        break;
      case 'ban':
        if (banReason.trim()) {
          banUser(selectedUser.id, banReason);
        } else {
          alert('Please provide a ban reason');
        }
        break;
      case 'unban':
        unbanUser(selectedUser.id);
        break;
    }
  }

  function getRoleColor(role: UserRole): string {
    switch (role) {
      case 'superadmin':
        return '#FF6B6B';
      case 'planner':
        return '#4ECDC4';
      case 'vendor':
        return '#45B7D1';
      case 'guest':
        return '#96CEB4';
      default:
        return '#FFEAA7';
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView style={styles.userList}>
        {filteredUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          filteredUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => {
                setSelectedUser(user);
                setRoleModalVisible(true);
              }}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name || 'No name'}</Text>
                <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
                <Text style={styles.userDate}>
                  Joined: {new Date(user.created_at || '').toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.userMeta}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                </View>
                {user.is_banned && (
                  <View style={styles.bannedBadge}>
                    <Text style={styles.bannedText}>BANNED</Text>
                  </View>
                )}
                <Text style={styles.weddingCount}>{user.wedding_count} weddings</Text>
                <Text style={styles.userCurrency}>Currency: {user.currency || 'UGX'}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedUser(user);
                      setCurrencyModalVisible(true);
                      setSelectedCurrency(user.currency || 'UGX');
                    }}
                  >
                    <Text style={styles.actionButtonText}>Currency</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedUser(user);
                      loadUserActivities(user.id);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Activity</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={() => {
                      setSelectedUser(user);
                      handleAction(user.is_banned ? 'unban' : 'ban');
                    }}
                  >
                    <Text style={styles.actionButtonText}>{user.is_banned ? 'Unban' : 'Ban'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      setSelectedUser(user);
                      handleAction('delete');
                    }}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update User Role</Text>
            {selectedUser && (
              <>
                <Text style={styles.modalUserInfo}>
                  {selectedUser.full_name || selectedUser.email}
                </Text>
                <Text style={styles.modalCurrentRole}>
                  Current role: {selectedUser.role}
                </Text>

                <View style={styles.roleButtons}>
                  {(['couple', 'planner', 'vendor', 'guest', 'superadmin'] as UserRole[]).map(
                    (role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleButton,
                          selectedUser.role === role && styles.roleButtonActive,
                        ]}
                        onPress={() => updateUserRole(selectedUser.id, role)}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            selectedUser.role === role && styles.roleButtonTextActive,
                          ]}
                        >
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setRoleModalVisible(false);
                setSelectedUser(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setActionModalVisible(false);
          setSelectedUser(null);
          setActionType(null);
          setBanReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'delete' ? 'Delete User' : actionType === 'ban' ? 'Ban User' : 'Unban User'}
            </Text>
            {selectedUser && (
              <>
                <Text style={styles.modalUserInfo}>
                  {selectedUser.full_name || selectedUser.email}
                </Text>
                {actionType === 'delete' && (
                  <Text style={styles.warningText}>
                    This action cannot be undone. All user data will be permanently deleted.
                  </Text>
                )}
                {actionType === 'ban' && (
                  <View>
                    <TextInput
                      style={styles.banReasonInput}
                      placeholder="Reason for banning..."
                      value={banReason}
                      onChangeText={setBanReason}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}
                {actionType === 'unban' && (
                  <Text style={styles.modalCurrentRole}>
                    This will restore the user's access to the platform.
                  </Text>
                )}

                <View style={styles.actionModalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelModalButton]}
                    onPress={() => {
                      setActionModalVisible(false);
                      setSelectedUser(null);
                      setActionType(null);
                      setBanReason('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmModalButton]}
                    onPress={confirmAction}
                  >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCurrencyModalVisible(false);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Currency</Text>
            {selectedUser && (
              <>
                <Text style={styles.modalUserInfo}>
                  {selectedUser.full_name || selectedUser.email}
                </Text>
                <Text style={styles.modalCurrentRole}>
                  Current currency: {selectedUser.currency || 'UGX'}
                </Text>
                <View style={styles.roleButtons}>
                  {['UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'RWF', 'BIF', 'CDF', 'ZAR', 'NGN', 'GHS', 'XOF', 'XAF'].map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.roleButton,
                        selectedCurrency === currency && styles.roleButtonActive
                      ]}
                      onPress={() => handleCurrencyChange(currency)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        selectedCurrency === currency && styles.roleButtonTextActive
                      ]}>
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setCurrencyModalVisible(false);
                    setSelectedUser(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={activityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setActivityModalVisible(false);
          setUserActivities([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>User Activity Log</Text>
            {selectedUser && (
              <>
                <Text style={styles.modalUserInfo}>
                  {selectedUser.full_name || selectedUser.email}
                </Text>
                <ScrollView style={styles.activityList}>
                  {userActivities.length === 0 ? (
                    <Text style={styles.emptyText}>No activity found</Text>
                  ) : (
                    userActivities.map((activity) => (
                      <View key={activity.id} style={styles.activityItem}>
                        <Text style={styles.activityAction}>{activity.action}</Text>
                        {activity.entity_type && (
                          <Text style={styles.activityEntity}>
                            {activity.entity_type}: {activity.entity_id}
                          </Text>
                        )}
                        <Text style={styles.activityTime}>
                          {new Date(activity.created_at).toLocaleString()}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setActivityModalVisible(false);
                    setUserActivities([]);
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  userList: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  weddingCount: {
    fontSize: 12,
    color: '#666',
  },
  userCurrency: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalUserInfo: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalCurrentRole: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  roleButtonActive: {
    backgroundColor: '#1a1a2e',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bannedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    marginBottom: 4,
  },
  bannedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteButton: {
    backgroundColor: '#333',
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 15,
  },
  banReasonInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginVertical: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#eee',
  },
  confirmModalButton: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContentLarge: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  activityList: {
    maxHeight: 400,
    marginVertical: 15,
  },
  activityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityAction: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityEntity: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
