import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from './firebase';
import { FIREBASE_COLLECTIONS } from '../utils/constants';
import { openWhatsApp, sanitizePhone } from '../utils/helpers';
import { WHATSAPP_TEMPLATES } from '../utils/constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};

export const saveUserPushToken = async (userId, token) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userId), {
    pushToken: token,
    updatedAt: serverTimestamp(),
  });
};

export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
};

export const createNotification = async (targetUserId, title, message, type = 'general', data = {}) => {
  await addDoc(collection(db, FIREBASE_COLLECTIONS.NOTIFICATIONS), {
    targetUserId,
    title,
    message,
    type,
    data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
};

export const getNotifications = async (userId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.NOTIFICATIONS),
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markNotificationRead = async (notificationId) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.NOTIFICATIONS, notificationId), {
    isRead: true,
  });
};

export const getUnreadCount = async (userId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.NOTIFICATIONS),
    where('targetUserId', '==', userId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  return snap.size;
};

export const sendPaymentReminder = async (phone, playerName, amount, month, dueDate) => {
  const cleanPhone = sanitizePhone(phone);
  const message = WHATSAPP_TEMPLATES.PAYMENT_REMINDER(playerName, amount, month, dueDate);
  await openWhatsApp(cleanPhone, message);
};

export const sendPaymentConfirmation = async (phone, playerName, amount, month, receiptNo) => {
  const cleanPhone = sanitizePhone(phone);
  const message = WHATSAPP_TEMPLATES.PAYMENT_CONFIRMED(playerName, amount, month, receiptNo);
  await openWhatsApp(cleanPhone, message);
};

export const sendAttendanceReport = async (phone, playerName, month, present, total) => {
  const cleanPhone = sanitizePhone(phone);
  const message = WHATSAPP_TEMPLATES.ATTENDANCE_REPORT(playerName, month, present, total);
  await openWhatsApp(cleanPhone, message);
};

export const sendBroadcastWhatsApp = async (phones, message) => {
  for (const phone of phones) {
    const cleanPhone = sanitizePhone(phone);
    const fullMessage = WHATSAPP_TEMPLATES.BROADCAST(message);
    await openWhatsApp(cleanPhone, fullMessage);
    await new Promise((r) => setTimeout(r, 500));
  }
};

export const saveBroadcast = async (adminId, title, message, targetCategories, targetRole) => {
  const ref = await addDoc(collection(db, FIREBASE_COLLECTIONS.BROADCASTS), {
    adminId,
    title,
    message,
    targetCategories,
    targetRole,
    sentAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getBroadcasts = async () => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.BROADCASTS),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
