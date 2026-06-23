const Notification = require('../models/Notification');
const User = require('../models/User');
const { Expo } = require('expo-server-sdk');

let firebaseAdmin = null;
let firebaseReady = false;

try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    !process.env.FIREBASE_PROJECT_ID.includes('your_') &&
    process.env.FIREBASE_PRIVATE_KEY &&
    !process.env.FIREBASE_PRIVATE_KEY.includes('your_')
  ) {
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseAdmin = admin;
    firebaseReady = true;
    console.log('Firebase Admin initialized for FCM');
  }
} catch (error) {
  console.log('Firebase Admin not configured — in-app notifications only');
}

const expo = new Expo();

async function sendPushNotification(token, title, body, data = {}) {
  if (!token) return;

  try {
    if (Expo.isExpoPushToken(token)) {
      const messages = [{ to: token, sound: 'default', title, body, data }];
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      return;
    }

    if (firebaseReady && firebaseAdmin) {
      await firebaseAdmin.messaging().send({
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        token,
      });
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
}

async function sendNotification(userId, type, title, body, data = {}) {
  try {
    const notification = await Notification.create({
      recipient: userId,
      title,
      body,
      type,
      data,
    });

    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendPushNotification(user.fcmToken, title, body, { type, ...data });
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

module.exports = { sendNotification, sendPushNotification };
