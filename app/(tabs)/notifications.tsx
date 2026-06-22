import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme as appTheme } from '../../config/theme';

interface Notification {
  id: string;
  type: 'task' | 'budget' | 'guest' | 'vendor' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: string;
}

interface NotificationGroup {
  title: string;
  notifications: Notification[];
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'task',
      title: 'Task Due Soon',
      message: 'Book venue photographer is due in 3 days',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      action: 'View Task',
    },
    {
      id: '2',
      type: 'budget',
      title: 'Budget Alert',
      message: 'Catering category is 90% of budget',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      action: 'View Budget',
    },
    {
      id: '3',
      type: 'guest',
      title: 'New RSVP',
      message: 'John Smith confirmed attendance',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
    },
    {
      id: '4',
      type: 'vendor',
      title: 'Vendor Response',
      message: 'Florist sent you a quote',
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      action: 'View Quote',
    },
    {
      id: '5',
      type: 'reminder',
      title: 'Payment Reminder',
      message: 'Venue deposit is due next week',
      timestamp: new Date(Date.now() - 259200000),
      read: true,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return 'checkbox-circle';
      case 'budget': return 'cash';
      case 'guest': return 'person';
      case 'vendor': return 'briefcase';
      case 'reminder': return 'alarm';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task': return appTheme.info;
      case 'budget': return appTheme.warning;
      case 'guest': return appTheme.success;
      case 'vendor': return appTheme.colors.accent.default;
      case 'reminder': return appTheme.error;
      default: return appTheme.textDisabled;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const groupedNotifications = useMemo(() => {
    const groups: NotificationGroup[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayNotifications = notifications.filter(n => new Date(n.timestamp) >= today);
    const yesterdayNotifications = notifications.filter(n => {
      const date = new Date(n.timestamp);
      return date >= yesterday && date < today;
    });
    const earlierNotifications = notifications.filter(n => new Date(n.timestamp) < yesterday);

    if (todayNotifications.length > 0) {
      groups.push({ title: 'Today', notifications: todayNotifications });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({ title: 'Yesterday', notifications: yesterdayNotifications });
    }
    if (earlierNotifications.length > 0) {
      groups.push({ title: 'Earlier', notifications: earlierNotifications });
    }

    return groups;
  }, [notifications]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable style={styles.headerButton} onPress={handleMarkAllRead}>
              <Ionicons name="checkmark-done" size={20} color={appTheme.textSecondary} />
            </Pressable>
          )}
          <Pressable style={styles.headerButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color={appTheme.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Notification List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {notifications.length > 0 ? (
          groupedNotifications.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
                  onPress={() => handleMarkAsRead(notification.id)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) + '15' }]}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={18}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>{notification.message}</Text>
                  {notification.action && (
                    <Pressable style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>{notification.action}</Text>
                      <Ionicons name="arrow-forward" size={14} color={appTheme.textSecondary} />
                    </Pressable>
                  )}
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={56} color={appTheme.textDisabled} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up! We'll notify you when there's something new.
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: appTheme.text,
  },
  unreadBadge: {
    backgroundColor: appTheme.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appTheme.colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  group: {
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: appTheme.background,
    borderBottomWidth: 1,
    borderColor: appTheme.colors.surface.raised,
  },
  notificationCardUnread: {
    backgroundColor: appTheme.colors.surface.raised,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: appTheme.text,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: appTheme.textDisabled,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appTheme.text,
  },
  notificationMessage: {
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
    marginLeft: 48,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: appTheme.colors.surface.raised,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: appTheme.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: appTheme.textDisabled,
    textAlign: 'center',
    marginTop: 6,
  },
});
