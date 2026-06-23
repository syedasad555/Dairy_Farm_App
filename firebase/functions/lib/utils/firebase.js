"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = exports.messaging = exports.storage = exports.auth = exports.db = void 0;
exports.getAdminUsers = getAdminUsers;
exports.createNotification = createNotification;
exports.sendPushNotification = sendPushNotification;
exports.notifyUser = notifyUser;
exports.notifyAdmins = notifyAdmins;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.db = admin.firestore();
exports.auth = admin.auth();
exports.storage = admin.storage();
exports.messaging = admin.messaging();
exports.COLLECTIONS = {
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
};
async function getAdminUsers() {
    const snap = await exports.db.collection(exports.COLLECTIONS.USERS).where('role', '==', 'admin').get();
    return snap.docs.map((d) => ({ id: d.id, fcmToken: d.data().fcmToken }));
}
async function createNotification(userId, title, body, type, data) {
    await exports.db.collection(exports.COLLECTIONS.NOTIFICATIONS).add({
        userId,
        title,
        body,
        type,
        data: data ?? {},
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
async function sendPushNotification(fcmToken, title, body, data) {
    if (!fcmToken)
        return;
    try {
        await exports.messaging.send({
            token: fcmToken,
            notification: { title, body },
            data: data ?? {},
        });
    }
    catch (err) {
        console.error('FCM send failed:', err);
    }
}
async function notifyUser(userId, title, body, type, data) {
    await createNotification(userId, title, body, type, data);
    const userDoc = await exports.db.collection(exports.COLLECTIONS.USERS).doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    await sendPushNotification(fcmToken, title, body, data);
}
async function notifyAdmins(title, body, type, data) {
    const admins = await getAdminUsers();
    await Promise.all(admins.map((admin) => notifyUser(admin.id, title, body, type, data)));
}
//# sourceMappingURL=firebase.js.map