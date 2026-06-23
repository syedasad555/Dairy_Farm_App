import * as admin from 'firebase-admin';

admin.initializeApp();

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();

export const COLLECTIONS = {
  USERS: 'users',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  SUBSCRIPTIONS: 'subscriptions',
  DELIVERY_PARTNERS: 'deliveryPartners',
  NOTIFICATIONS: 'notifications',
  BILLING_STATEMENTS: 'billingStatements',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  COMPLAINTS: 'complaints',
} as const;

export async function getAdminUsers(): Promise<{ id: string; fcmToken?: string }[]> {
  const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'admin').get();
  return snap.docs.map((d) => ({ id: d.id, fcmToken: d.data().fcmToken }));
}

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, string>
): Promise<void> {
  await db.collection(COLLECTIONS.NOTIFICATIONS).add({
    userId,
    title,
    body,
    type,
    data: data ?? {},
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function sendPushNotification(
  fcmToken: string | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!fcmToken) return;

  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
    });
  } catch (err) {
    console.error('FCM send failed:', err);
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, string>
): Promise<void> {
  await createNotification(userId, title, body, type, data);

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;
  await sendPushNotification(fcmToken, title, body, data);
}

export async function notifyAdmins(title: string, body: string, type: string, data?: Record<string, string>): Promise<void> {
  const admins = await getAdminUsers();
  await Promise.all(admins.map((admin) => notifyUser(admin.id, title, body, type, data)));
}
