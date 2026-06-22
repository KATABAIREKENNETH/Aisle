import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWeddingStore } from '../../store/weddingStore';
import { useMessageStore } from '../../store/messageStore';
import { getConversations, getConversationMessages, sendMessage, markConversationAsRead, createConversation, getConversationParticipants, addParticipant, removeParticipant, getAvailableUsers } from '../../lib/api/messages';
import { formatDistanceToNow } from 'date-fns';
import { theme as appTheme } from '../../config/theme';
import type { ConversationWithDetails, Message, ConversationParticipant } from '../../types/message';
import type { AvailableUser } from '../../lib/api/messages';

const BG = '#F2F2F7';
const CARD_BG = '#FFFFFF';
const SEPARATOR = '#E5E5EA';
const LABEL_COLOR = '#6C6C70';
const ROW_TEXT = '#1C1C1E';

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const { wedding } = useWeddingStore();
  const { conversations, setConversations, selectedConversation, setSelectedConversation, messages, setMessages } = useMessageStore();
  
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = async () => {
    if (!wedding?.id || !user?.id) return;
    
    try {
      setLoading(true);
      const data = await getConversations(wedding.id, user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadParticipants = async (conversationId: string) => {
    try {
      const data = await getConversationParticipants(conversationId);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadAvailableUsers = async () => {
    if (!wedding?.id || !user?.id) return;
    
    try {
      const data = await getAvailableUsers(wedding.id, user.id);
      setAvailableUsers(data);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  useEffect(() => {
    if (wedding?.id && user?.id) {
      loadConversations();
    }
  }, [wedding?.id, user?.id]);

  useEffect(() => {
    if (showCreateGroupModal && wedding?.id && user?.id) {
      loadAvailableUsers();
    }
  }, [showCreateGroupModal]);

  useEffect(() => {
    if (showAddParticipantModal && wedding?.id && user?.id) {
      loadAvailableUsers();
    }
  }, [showAddParticipantModal]);

  useEffect(() => {
    if (selectedConversation && wedding?.id && user?.id) {
      loadConversationMessages(selectedConversation);
      markConversationAsRead(selectedConversation, user.id);
      loadParticipants(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user?.id) return;
    
    try {
      setSending(true);
      await sendMessage({
        conversation_id: selectedConversation,
        content: messageText,
      }, user.id);
      
      setMessageText('');
      loadConversationMessages(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !wedding?.id || !user?.id) return;
    
    try {
      await createConversation({
        wedding_id: wedding.id,
        name: groupName,
        is_group: true,
        participant_ids: selectedParticipants,
      }, user.id);
      
      setGroupName('');
      setSelectedParticipants([]);
      setShowCreateGroupModal(false);
      loadConversations();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleStartIndividualConversation = async (userId: string) => {
    if (!wedding?.id || !user?.id) return;
    
    try {
      await createConversation({
        wedding_id: wedding.id,
        is_group: false,
        participant_ids: [userId],
      }, user.id);
      
      setShowCreateGroupModal(false);
      setShowAddParticipantModal(false);
      loadConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedConversation) return;
    
    try {
      await removeParticipant(selectedConversation, userId);
      loadParticipants(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!selectedConversation) return;
    
    try {
      await addParticipant(selectedConversation, userId, 'member');
      loadParticipants(selectedConversation);
      loadConversations();
      setShowAddParticipantModal(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const toggleParticipantSelection = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversationItem = ({ item }: { item: ConversationWithDetails }) => {
    const isGroup = item.is_group;
    const displayName = isGroup ? item.name || 'Group' : item.participants.find(p => p.user_id !== user?.id)?.user?.full_name || 'Unknown';
    const avatarText = displayName.charAt(0).toUpperCase();
    
    return (
      <Pressable
        style={styles.conversationItem}
        onPress={() => setSelectedConversation(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarText}</Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.conversationTitleRow}>
              <Text style={styles.participantName}>{displayName}</Text>
              {isGroup && <Ionicons name="people" size={16} color={appTheme.textDisabled} />}
            </View>
            <Text style={styles.messageTime}>
              {item.last_message ? formatDistanceToNow(new Date(item.last_message.created_at), { addSuffix: true }) : ''}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message?.content || 'No messages yet'}
          </Text>
        </View>
        {item.unread_count && item.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn ? styles.messageTimeOwn : styles.messageTimeOther]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  const isGroupConversation = selectedConversationData?.is_group || false;
  const conversationName = isGroupConversation 
    ? selectedConversationData?.name || 'Group' 
    : selectedConversationData?.participants.find(p => p.user_id !== user?.id)?.user?.full_name || 'Unknown';
    
  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedConversation(null)} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={appTheme.text} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {conversationName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>{conversationName}</Text>
              {isGroupConversation && <Ionicons name="people" size={16} color={appTheme.textDisabled} />}
            </View>
            <Text style={styles.headerStatus}>
              {selectedConversationData?.participants.length || 0} participants
            </Text>
          </View>
          {isGroupConversation && (
            <Pressable onPress={() => setShowParticipantsModal(true)} style={styles.headerAction}>
              <Ionicons name="people-circle-outline" size={24} color={appTheme.text} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size={20} />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        <Modal
          visible={showParticipantsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowParticipantsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Participants</Text>
                <Pressable onPress={() => setShowParticipantsModal(false)}>
                  <Ionicons name="close" size={24} color={appTheme.text} />
                </Pressable>
              </View>
              
              <Pressable
                style={styles.addParticipantButton}
                onPress={() => {
                  setShowParticipantsModal(false);
                  setShowAddParticipantModal(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color={appTheme.primary} />
                <Text style={styles.addParticipantButtonText}>Add Participant</Text>
              </Pressable>
              
              <FlatList
                data={participants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantAvatarText}>
                        {item.user?.full_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{item.user?.full_name || 'Unknown'}</Text>
                      <Text style={styles.participantRole}>{item.role}</Text>
                    </View>
                    {item.user_id !== user?.id && (
                      <Pressable 
                        style={styles.removeParticipantButton}
                        onPress={() => handleRemoveParticipant(item.user_id)}
                      >
                        <Ionicons name="remove-circle" size={24} color={appTheme.error} />
                      </Pressable>
                    )}
                  </View>
                )}
                contentContainerStyle={styles.participantsList}
              />
            </View>
          </View>
        </Modal>

        <Modal
          visible={showAddParticipantModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddParticipantModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedConversation ? 'Add Participant' : 'Start Conversation'}</Text>
                <Pressable onPress={() => setShowAddParticipantModal(false)}>
                  <Ionicons name="close" size={24} color={appTheme.text} />
                </Pressable>
              </View>
              
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              
              <FlatList
                data={filteredUsers.filter(user => 
                  selectedConversation 
                    ? !participants.some(p => p.user_id === user.id)
                    : !conversations.some(c => 
                        !c.is_group && 
                        c.participants.some(p => p.user_id === user.id)
                      )
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.userItem}
                    onPress={() => {
                      if (selectedConversation) {
                        handleAddParticipant(item.id);
                      } else {
                        handleStartIndividualConversation(item.id);
                      }
                    }}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {item.full_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.full_name || 'Unknown'}</Text>
                      <Text style={styles.userType}>{item.type}</Text>
                    </View>
                    <Ionicons name={selectedConversation ? "add-circle" : "chevron-forward"} size={24} color={appTheme.primary} />
                  </Pressable>
                )}
                contentContainerStyle={styles.usersList}
                ListEmptyComponent={
                  <Text style={styles.emptyUsersText}>No users available</Text>
                }
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowCreateGroupModal(true)} style={styles.headerActionButton}>
            <Ionicons name="people" size={24} color={appTheme.text} />
          </Pressable>
          <Pressable onPress={() => setShowAddParticipantModal(true)} style={styles.headerActionButton}>
            <Ionicons name="chatbubble" size={24} color={appTheme.text} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={appTheme.primary} size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={appTheme.textDisabled} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Create a group or start a conversation with someone
          </Text>
          <Pressable 
            style={styles.createButton}
            onPress={() => setShowCreateGroupModal(true)}
          >
            <Text style={styles.createButtonText}>Create Group</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
        />
      )}

      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <Pressable onPress={() => setShowCreateGroupModal(false)}>
                <Ionicons name="close" size={24} color={appTheme.text} />
              </Pressable>
            </View>
            
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name"
              value={groupName}
              onChangeText={setGroupName}
            />
            
            <Text style={styles.modalSubtitle}>Participants</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedParticipants.includes(item.id);
                return (
                  <Pressable
                    style={[styles.userItem, isSelected && styles.userItemSelected]}
                    onPress={() => toggleParticipantSelection(item.id)}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {item.full_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.full_name || 'Unknown'}</Text>
                      <Text style={styles.userType}>{item.type}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={appTheme.primary} />
                    )}
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.usersList}
              ListEmptyComponent={
                <Text style={styles.emptyUsersText}>No users found</Text>
              }
            />
            
            <View style={styles.modalFooter}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateGroupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, !groupName.trim() && styles.modalButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={!groupName.trim()}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: SEPARATOR,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
  },
  backButton: {
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: ROW_TEXT,
  },
  headerStatus: {
    fontSize: 12,
    color: LABEL_COLOR,
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ROW_TEXT,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: ROW_TEXT,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: LABEL_COLOR,
    textAlign: 'center',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: appTheme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ROW_TEXT,
  },
  groupNameInput: {
    backgroundColor: BG,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ROW_TEXT,
    marginBottom: 4,
  },
  modalInfo: {
    fontSize: 14,
    color: LABEL_COLOR,
    marginBottom: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: BG,
  },
  cancelButtonText: {
    color: ROW_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  participantsList: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: BG,
    borderRadius: 12,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
  },
  participantRole: {
    fontSize: 12,
    color: LABEL_COLOR,
  },
  removeParticipantButton: {
    padding: 8,
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addParticipantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchInput: {
    backgroundColor: BG,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  usersList: {
    padding: 16,
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 8,
  },
  userItemSelected: {
    backgroundColor: `${appTheme.primary}20`,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: ROW_TEXT,
  },
  userType: {
    fontSize: 12,
    color: LABEL_COLOR,
  },
  emptyUsersText: {
    textAlign: 'center',
    color: LABEL_COLOR,
    fontSize: 14,
    padding: 16,
  },
  conversationsList: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: appTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: ROW_TEXT,
  },
  messageTime: {
    fontSize: 12,
    color: LABEL_COLOR,
  },
  lastMessage: {
    fontSize: 14,
    color: LABEL_COLOR,
  },
  unreadBadge: {
    backgroundColor: appTheme.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 8,
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleOwn: {
    backgroundColor: appTheme.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: CARD_BG,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: ROW_TEXT,
  },
  messageTimeOwn: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  messageTimeOther: {
    fontSize: 11,
    color: LABEL_COLOR,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: SEPARATOR,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: appTheme.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
