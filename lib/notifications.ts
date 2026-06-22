import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null,
  });
}

export async function scheduleTaskReminder(taskId: string, taskTitle: string, dueDate: Date) {
  const now = new Date();
  const reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before due
  
  if (reminderTime > now) {
    await scheduleNotification(
      'Task Due Soon',
      `"${taskTitle}" is due tomorrow`,
      { type: 'task_reminder', taskId },
      { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime }
    );
  }
}

export async function scheduleRSVPReminder(guestId: string, guestName: string, deadline: Date) {
  const now = new Date();
  const reminderTime = new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before deadline
  
  if (reminderTime > now) {
    await scheduleNotification(
      'RSVP Reminder',
      `${guestName} hasn't RSVP'd yet`,
      { type: 'rsvp_reminder', guestId },
      { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime }
    );
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  // This would typically call a backend service to send push notifications
  // For now, we'll use local notifications as a fallback
  await scheduleNotification(title, body, data);
}

export function setupNotificationHandlers() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    // Handle notification tap
    const data = response.notification.request.content.data;
    
    if (data?.type === 'task_reminder') {
      // Navigate to task detail
    } else if (data?.type === 'rsvp_reminder') {
      // Navigate to guest detail
    } else if (data?.type === 'vendor_message') {
      // Navigate to vendor detail
    }
  });
}

export async function registerForPushNotifications() {
  const token = await Notifications.getExpoPushTokenAsync();
  
  // Store the token in Supabase for the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token: token.data,
        platform: Platform.OS,
      });
  }
  
  return token.data;
}
