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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onComplaintCreated = exports.updateDailyAnalytics = exports.generateMonthlyReport = exports.generateMonthlyBills = exports.generateSubscriptionOrders = exports.completeDelivery = exports.notifyOrderCreated = exports.createDeliveryPartner = exports.notifyCustomerApproved = exports.notifyAdminsNewRegistration = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const firebase_1 = require("./utils/firebase");
const deliverySlots_1 = require("./utils/deliverySlots");
const types_1 = require("./utils/types");
// ─── Auth & Registration ───────────────────────────────────────────
exports.notifyAdminsNewRegistration = (0, https_1.onCall)(async (request) => {
    const { customerId, customerName } = request.data;
    await (0, firebase_1.notifyAdmins)('New Customer Registration', `New customer registration pending approval: ${customerName}`, 'registration_pending', { customerId });
    return { success: true };
});
exports.notifyCustomerApproved = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const { customerId } = request.data;
    await (0, firebase_1.notifyUser)(customerId, 'Account Approved', 'Your MVR Farms account has been approved. You can now login and place orders.', 'account_approved');
    return { success: true };
});
exports.createDeliveryPartner = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const caller = await firebase_1.db.collection(firebase_1.COLLECTIONS.USERS).doc(request.auth.uid).get();
    if (caller.data()?.role !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Admin only');
    const { name, mobile, password, areaName, pincodes } = request.data;
    const email = `${mobile.replace(/\D/g, '')}@mvrfarms.app`;
    const userRecord = await firebase_1.auth.createUser({ email, password, displayName: name });
    await firebase_1.db.collection(firebase_1.COLLECTIONS.USERS).doc(userRecord.uid).set({
        name,
        mobile: mobile.replace(/\D/g, ''),
        role: 'delivery_partner',
        status: 'approved',
        language: 'english',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const partnerId = `dp_${Date.now()}`;
    await firebase_1.db.collection(firebase_1.COLLECTIONS.DELIVERY_PARTNERS).doc(partnerId).set({
        userId: userRecord.uid,
        name,
        mobile: mobile.replace(/\D/g, ''),
        assignedPincodes: pincodes,
        assignedAreaName: areaName,
        active: true,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { partnerId, userId: userRecord.uid };
});
// ─── Orders ────────────────────────────────────────────────────────
exports.notifyOrderCreated = (0, https_1.onCall)(async (request) => {
    const { orderId, customerId, orderNumber } = request.data;
    await (0, firebase_1.notifyUser)(customerId, 'Order Placed', `Your order ${orderNumber} has been placed.`, 'order_created', { orderId });
    await (0, firebase_1.notifyAdmins)('New Order', `Order ${orderNumber} has been created.`, 'order_created', { orderId });
    return { success: true };
});
exports.completeDelivery = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const { orderId, proof } = request.data;
    const orderRef = firebase_1.db.collection(firebase_1.COLLECTIONS.ORDERS).doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists)
        throw new https_1.HttpsError('not-found', 'Order not found');
    const order = orderDoc.data();
    await firebase_1.db.collection('deliveryProofs').add({
        orderId,
        ...proof,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const partnerRef = firebase_1.db.collection(firebase_1.COLLECTIONS.DELIVERY_PARTNERS).doc(order.deliveryPartnerId);
    const partnerDoc = await partnerRef.get();
    if (partnerDoc.exists) {
        await partnerRef.update({
            totalDeliveries: admin.firestore.FieldValue.increment(1),
            successfulDeliveries: admin.firestore.FieldValue.increment(1),
        });
    }
    const title = 'Order Delivered';
    const body = `Order ${order.orderNumber} delivered successfully.`;
    await (0, firebase_1.notifyUser)(order.customerId, title, body, 'delivered', { orderId, photoUrl: proof.photoUrl });
    await (0, firebase_1.notifyAdmins)('Delivery Completed', `Order ${order.orderNumber} — ${order.customerName} — delivered by ${order.deliveryPartnerName}`, 'delivered', { orderId, photoUrl: proof.photoUrl });
    return { success: true };
});
// ─── Subscription Order Generation (Daily) ─────────────────────────
exports.generateSubscriptionOrders = (0, scheduler_1.onSchedule)('0 2 * * *', async () => {
    const today = new Date().toISOString().split('T')[0];
    const subsSnap = await firebase_1.db
        .collection(firebase_1.COLLECTIONS.SUBSCRIPTIONS)
        .where('active', '==', true)
        .where('startDate', '<=', today)
        .where('endDate', '>=', today)
        .get();
    const ordersSnap = await firebase_1.db.collection(firebase_1.COLLECTIONS.ORDERS).get();
    let orderCount = ordersSnap.size;
    for (const subDoc of subsSnap.docs) {
        const sub = subDoc.data();
        const slot = (0, deliverySlots_1.assignNearestDeliverySlot)();
        const customerDoc = await firebase_1.db.collection(firebase_1.COLLECTIONS.USERS).doc(sub.customerId).get();
        if (!customerDoc.exists)
            continue;
        const customer = customerDoc.data();
        const addressesSnap = await firebase_1.db
            .collection('addresses')
            .where('userId', '==', sub.customerId)
            .where('isDefault', '==', true)
            .limit(1)
            .get();
        if (addressesSnap.empty)
            continue;
        const address = addressesSnap.docs[0].data();
        const partnersSnap = await firebase_1.db
            .collection(firebase_1.COLLECTIONS.DELIVERY_PARTNERS)
            .where('assignedPincodes', 'array-contains', address.pincode)
            .where('active', '==', true)
            .limit(1)
            .get();
        if (partnersSnap.empty)
            continue;
        const partner = partnersSnap.docs[0];
        const orderId = `ord_sub_${Date.now()}_${subDoc.id}`;
        const totalAmount = (sub.price ?? 0) * (sub.quantity ?? 1);
        await firebase_1.db.collection(firebase_1.COLLECTIONS.ORDERS).doc(orderId).set({
            orderNumber: (0, deliverySlots_1.generateOrderNumber)(orderCount++),
            customerId: sub.customerId,
            customerName: sub.customerName ?? customer.name,
            customerMobile: customer.mobile,
            deliveryPartnerId: partner.id,
            deliveryPartnerName: partner.data().name,
            items: [{
                    productId: sub.productId,
                    productName: sub.productName,
                    variantName: sub.variantName,
                    quantity: sub.quantity,
                    price: sub.price,
                    totalPrice: totalAmount,
                }],
            addressId: addressesSnap.docs[0].id,
            address,
            status: 'assigned',
            slot: sub.slot ?? slot.slot,
            slotLabel: slot.slotLabel,
            scheduledDate: slot.scheduledDate,
            totalAmount,
            totalQuantity: sub.quantity,
            subscriptionId: subDoc.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log(`Generated subscription orders for ${subsSnap.size} subscriptions`);
});
// ─── Monthly Billing (1st of each month) ───────────────────────────
exports.generateMonthlyBills = (0, scheduler_1.onSchedule)('0 3 1 * *', async () => {
    const now = new Date();
    const month = now.getMonth(); // previous month handled below
    const year = now.getFullYear();
    const prevMonth = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    const startDate = new Date(prevYear, prevMonth - 1, 1).toISOString();
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59).toISOString();
    const ordersSnap = await firebase_1.db
        .collection(firebase_1.COLLECTIONS.ORDERS)
        .where('status', '==', 'delivered')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();
    const customerOrders = {};
    for (const doc of ordersSnap.docs) {
        const customerId = doc.data().customerId;
        if (!customerOrders[customerId])
            customerOrders[customerId] = [];
        customerOrders[customerId].push(doc);
    }
    for (const [customerId, docs] of Object.entries(customerOrders)) {
        const totalAmount = docs.reduce((sum, d) => sum + (d.data().totalAmount ?? 0), 0);
        const customerName = docs[0].data().customerName;
        const allItems = docs.flatMap((d) => d.data().items ?? []);
        const statementId = `bill_${customerId}_${prevYear}_${prevMonth}`;
        await firebase_1.db.collection(firebase_1.COLLECTIONS.BILLING_STATEMENTS).doc(statementId).set({
            customerId,
            customerName,
            month: prevMonth,
            year: prevYear,
            orders: allItems,
            orderIds: docs.map((d) => d.id),
            totalAmount,
            paidAmount: 0,
            pendingAmount: totalAmount,
            paymentStatus: 'unpaid',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await (0, firebase_1.notifyUser)(customerId, 'Monthly Bill Generated', `Your bill for ${prevMonth}/${prevYear} is ready. Total: ₹${totalAmount}`, 'monthly_bill', { statementId });
    }
});
// ─── Monthly PDF Report ────────────────────────────────────────────
exports.generateMonthlyReport = (0, scheduler_1.onSchedule)('0 4 1 * *', async () => {
    const now = new Date();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const ordersSnap = await firebase_1.db.collection(firebase_1.COLLECTIONS.ORDERS).get();
    const orders = ordersSnap.docs.map((d) => d.data());
    const monthOrders = orders.filter((o) => {
        const d = o.createdAt?.toDate?.() ?? new Date(o.createdAt);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const totalRevenue = monthOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    let milkLitres = 0;
    let gheeSold = 0;
    let eggPacks = 0;
    for (const order of monthOrders) {
        for (const item of order.items ?? []) {
            const name = (item.productName ?? '').toLowerCase();
            if (name.includes('milk')) {
                const qty = parseFloat(item.variantName ?? '0') || item.quantity;
                milkLitres += qty;
            }
            if (name.includes('ghee'))
                gheeSold += item.quantity;
            if (name.includes('egg'))
                eggPacks += item.quantity;
        }
    }
    const doc = new pdfkit_1.default();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.fontSize(20).text('MVR Farms — Monthly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Period: ${month}/${year}`);
    doc.text(`Total Orders: ${monthOrders.length}`);
    doc.text(`Total Revenue: ₹${totalRevenue}`);
    doc.text(`Deliveries: ${monthOrders.filter((o) => o.status === 'delivered').length}`);
    doc.text(`Milk Litres Sold: ${milkLitres}`);
    doc.text(`Ghee Sold: ${gheeSold}`);
    doc.text(`Egg Packs Sold: ${eggPacks}`);
    doc.end();
    await new Promise((resolve) => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);
    const bucket = firebase_1.storage.bucket();
    const filePath = `reports/MVR_Farms_Report_${year}_${month}.pdf`;
    const file = bucket.file(filePath);
    await file.save(pdfBuffer, { contentType: 'application/pdf' });
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2030' });
    await firebase_1.db.collection('reports').add({
        month,
        year,
        pdfUrl: url,
        totalRevenue,
        totalOrders: monthOrders.length,
        totalDeliveries: monthOrders.filter((o) => o.status === 'delivered').length,
        totalMilkLitres: milkLitres,
        totalGheeSold: gheeSold,
        totalEggPacksSold: eggPacks,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await (0, firebase_1.notifyAdmins)('Monthly Report Generated', `Report for ${month}/${year} is ready for download.`, 'monthly_report', { pdfUrl: url });
});
// ─── Daily Analytics Snapshot ──────────────────────────────────────
exports.updateDailyAnalytics = (0, scheduler_1.onSchedule)('0 1 * * *', async () => {
    const today = new Date().toISOString().split('T')[0];
    const ordersSnap = await firebase_1.db.collection(firebase_1.COLLECTIONS.ORDERS).get();
    const orders = ordersSnap.docs.map(types_1.mapOrderDoc);
    const todayOrders = orders.filter((o) => (0, types_1.getOrderCreatedIso)(o).startsWith(today));
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const weeklyOrders = orders.filter((o) => (0, types_1.getOrderCreatedIso)(o) >= weekAgo);
    const monthlyOrders = orders.filter((o) => (0, types_1.getOrderCreatedIso)(o) >= monthAgo);
    const revenue = monthlyOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const productCounts = {};
    for (const order of monthlyOrders) {
        for (const item of order.items ?? []) {
            const key = item.productId ?? item.productName;
            if (!key)
                continue;
            if (!productCounts[key])
                productCounts[key] = { name: item.productName ?? key, quantity: 0 };
            productCounts[key].quantity += item.quantity ?? 0;
        }
    }
    const topProducts = Object.entries(productCounts)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    await firebase_1.db.collection('analytics').doc(today).set({
        date: today,
        dailyOrders: todayOrders.length,
        weeklyOrders: weeklyOrders.length,
        monthlyOrders: monthlyOrders.length,
        revenue,
        topProducts,
        milkLitresSold: 0,
        gheeSold: 0,
        eggPacksSold: 0,
        customerGrowth: 0,
        deliveryPerformance: monthlyOrders.length > 0
            ? Math.round((monthlyOrders.filter((o) => o.status === 'delivered').length / monthlyOrders.length) * 100)
            : 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// ─── Complaint Notification Trigger ────────────────────────────────
exports.onComplaintCreated = (0, https_1.onCall)(async (request) => {
    const { complaintId, customerName, subject } = request.data;
    await (0, firebase_1.notifyAdmins)('New Complaint', `${customerName}: ${subject}`, 'complaint_raised', { complaintId });
    return { success: true };
});
//# sourceMappingURL=index.js.map