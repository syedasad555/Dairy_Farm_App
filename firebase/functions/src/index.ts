import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { db, auth, storage, notifyUser, notifyAdmins, COLLECTIONS } from './utils/firebase';
import { assignNearestDeliverySlot, generateOrderNumber } from './utils/deliverySlots';
import { mapOrderDoc, getOrderCreatedIso } from './utils/types';

// ─── Auth & Registration ───────────────────────────────────────────

export const notifyAdminsNewRegistration = onCall(async (request) => {
  const { customerId, customerName } = request.data as { customerId: string; customerName: string };

  await notifyAdmins(
    'New Customer Registration',
    `New customer registration pending approval: ${customerName}`,
    'registration_pending',
    { customerId }
  );

  return { success: true };
});

export const notifyCustomerApproved = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { customerId } = request.data as { customerId: string };

  await notifyUser(
    customerId,
    'Account Approved',
    'Your MVR Farms account has been approved. You can now login and place orders.',
    'account_approved'
  );

  return { success: true };
});

export const createDeliveryPartner = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const caller = await db.collection(COLLECTIONS.USERS).doc(request.auth.uid).get();
  if (caller.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Admin only');

  const { name, mobile, password, areaName, pincodes } = request.data as {
    name: string;
    mobile: string;
    password: string;
    areaName: string;
    pincodes: string[];
  };

  const email = `${mobile.replace(/\D/g, '')}@mvrfarms.app`;
  const userRecord = await auth.createUser({ email, password, displayName: name });

  await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
    name,
    mobile: mobile.replace(/\D/g, ''),
    role: 'delivery_partner',
    status: 'approved',
    language: 'english',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const partnerId = `dp_${Date.now()}`;
  await db.collection(COLLECTIONS.DELIVERY_PARTNERS).doc(partnerId).set({
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

export const notifyOrderCreated = onCall(async (request) => {
  const { orderId, customerId, orderNumber } = request.data as {
    orderId: string;
    customerId: string;
    orderNumber: string;
  };

  await notifyUser(customerId, 'Order Placed', `Your order ${orderNumber} has been placed.`, 'order_created', { orderId });
  await notifyAdmins('New Order', `Order ${orderNumber} has been created.`, 'order_created', { orderId });

  return { success: true };
});

export const completeDelivery = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { orderId, proof } = request.data as {
    orderId: string;
    proof: { photoUrl: string; latitude: number; longitude: number; deliveredAt: string };
  };

  const orderRef = db.collection(COLLECTIONS.ORDERS).doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new HttpsError('not-found', 'Order not found');

  const order = orderDoc.data()!;

  await db.collection('deliveryProofs').add({
    orderId,
    ...proof,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const partnerRef = db.collection(COLLECTIONS.DELIVERY_PARTNERS).doc(order.deliveryPartnerId);
  const partnerDoc = await partnerRef.get();
  if (partnerDoc.exists) {
    await partnerRef.update({
      totalDeliveries: admin.firestore.FieldValue.increment(1),
      successfulDeliveries: admin.firestore.FieldValue.increment(1),
    });
  }

  const title = 'Order Delivered';
  const body = `Order ${order.orderNumber} delivered successfully.`;

  await notifyUser(order.customerId, title, body, 'delivered', { orderId, photoUrl: proof.photoUrl });
  await notifyAdmins(
    'Delivery Completed',
    `Order ${order.orderNumber} — ${order.customerName} — delivered by ${order.deliveryPartnerName}`,
    'delivered',
    { orderId, photoUrl: proof.photoUrl }
  );

  return { success: true };
});

// ─── Subscription Order Generation (Daily) ─────────────────────────

export const generateSubscriptionOrders = onSchedule('0 2 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];

  const subsSnap = await db
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('active', '==', true)
    .where('startDate', '<=', today)
    .where('endDate', '>=', today)
    .get();

  const ordersSnap = await db.collection(COLLECTIONS.ORDERS).get();
  let orderCount = ordersSnap.size;

  for (const subDoc of subsSnap.docs) {
    const sub = subDoc.data();
    const slot = assignNearestDeliverySlot();

    const customerDoc = await db.collection(COLLECTIONS.USERS).doc(sub.customerId).get();
    if (!customerDoc.exists) continue;

    const customer = customerDoc.data()!;
    const addressesSnap = await db
      .collection('addresses')
      .where('userId', '==', sub.customerId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (addressesSnap.empty) continue;
    const address = addressesSnap.docs[0].data();

    const partnersSnap = await db
      .collection(COLLECTIONS.DELIVERY_PARTNERS)
      .where('assignedPincodes', 'array-contains', address.pincode)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (partnersSnap.empty) continue;
    const partner = partnersSnap.docs[0];

    const orderId = `ord_sub_${Date.now()}_${subDoc.id}`;
    const totalAmount = (sub.price ?? 0) * (sub.quantity ?? 1);

    await db.collection(COLLECTIONS.ORDERS).doc(orderId).set({
      orderNumber: generateOrderNumber(orderCount++),
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

export const generateMonthlyBills = onSchedule('0 3 1 * *', async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;

  const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
  const prevMonthEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

  const ordersSnap = await db
    .collection(COLLECTIONS.ORDERS)
    .where('status', '==', 'delivered')
    .get();

  const customerOrders: Record<string, FirebaseFirestore.QueryDocumentSnapshot[]> = {};
  for (const doc of ordersSnap.docs) {
    const order = mapOrderDoc(doc);
    const created = new Date(getOrderCreatedIso(order));
    if (created < prevMonthStart || created > prevMonthEnd) continue;

    const customerId = doc.data().customerId;
    if (!customerOrders[customerId]) customerOrders[customerId] = [];
    customerOrders[customerId].push(doc);
  }

  for (const [customerId, docs] of Object.entries(customerOrders)) {
    const totalAmount = docs.reduce((sum, d) => sum + (d.data().totalAmount ?? 0), 0);
    const customerName = docs[0].data().customerName;
    const allItems = docs.flatMap((d) => d.data().items ?? []);

    const statementId = `bill_${customerId}_${prevYear}_${prevMonth}`;
    await db.collection(COLLECTIONS.BILLING_STATEMENTS).doc(statementId).set({
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

    await notifyUser(
      customerId,
      'Monthly Bill Generated',
      `Your bill for ${prevMonth}/${prevYear} is ready. Total: ₹${totalAmount}`,
      'monthly_bill',
      { statementId }
    );
  }
});

// ─── Monthly PDF Report ────────────────────────────────────────────

export const generateMonthlyReport = onSchedule('0 4 1 * *', async () => {
  const now = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const ordersSnap = await db.collection(COLLECTIONS.ORDERS).get();
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
      if (name.includes('ghee')) gheeSold += item.quantity;
      if (name.includes('egg')) eggPacks += item.quantity;
    }
  }

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

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

  await new Promise<void>((resolve) => doc.on('end', resolve));
  const pdfBuffer = Buffer.concat(chunks);

  const bucket = storage.bucket();
  const filePath = `reports/MVR_Farms_Report_${year}_${month}.pdf`;
  const file = bucket.file(filePath);
  await file.save(pdfBuffer, { contentType: 'application/pdf' });
  const [url] = await file.getSignedUrl({ action: 'read', expires: '03-01-2030' });

  await db.collection('reports').add({
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

  await notifyAdmins(
    'Monthly Report Generated',
    `Report for ${month}/${year} is ready for download.`,
    'monthly_report',
    { pdfUrl: url }
  );
});

// ─── Daily Analytics Snapshot ──────────────────────────────────────

export const updateDailyAnalytics = onSchedule('0 1 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  const ordersSnap = await db.collection(COLLECTIONS.ORDERS).get();
  const orders = ordersSnap.docs.map(mapOrderDoc);

  const todayOrders = orders.filter((o) => getOrderCreatedIso(o).startsWith(today));

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const weeklyOrders = orders.filter((o) => getOrderCreatedIso(o) >= weekAgo);

  const monthlyOrders = orders.filter((o) => getOrderCreatedIso(o) >= monthAgo);

  const revenue = monthlyOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const productCounts: Record<string, { name: string; quantity: number }> = {};
  for (const order of monthlyOrders) {
    for (const item of order.items ?? []) {
      const key = item.productId ?? item.productName;
      if (!key) continue;
      if (!productCounts[key]) productCounts[key] = { name: item.productName ?? key, quantity: 0 };
      productCounts[key].quantity += item.quantity ?? 0;
    }
  }

  const topProducts = Object.entries(productCounts)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  await db.collection('analytics').doc(today).set({
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

export const onComplaintCreated = onCall(async (request) => {
  const { complaintId, customerName, subject } = request.data as {
    complaintId: string;
    customerName: string;
    subject: string;
  };

  await notifyAdmins(
    'New Complaint',
    `${customerName}: ${subject}`,
    'complaint_raised',
    { complaintId }
  );

  return { success: true };
});

// ─── Cancel Order (callable) ───────────────────────────────────────

export const cancelOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { orderId } = request.data as { orderId: string };
  const orderRef = db.collection(COLLECTIONS.ORDERS).doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new HttpsError('not-found', 'Order not found');

  const order = orderDoc.data()!;
  const caller = await db.collection(COLLECTIONS.USERS).doc(request.auth.uid).get();
  const role = caller.data()?.role;

  const isOwner = order.customerId === request.auth.uid;
  const isAdminUser = role === 'admin';
  if (!isOwner && !isAdminUser) throw new HttpsError('permission-denied', 'Not allowed');

  if (!['pending', 'assigned'].includes(order.status)) {
    throw new HttpsError('failed-precondition', 'Order cannot be cancelled at this stage');
  }

  await orderRef.update({
    status: 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await notifyUser(
    order.customerId,
    'Order Cancelled',
    `Order ${order.orderNumber} has been cancelled.`,
    'order_cancelled',
    { orderId }
  );

  return { success: true };
});

// ─── Save FCM Token (callable) ───────────────────────────────────────

export const saveFcmToken = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const { token } = request.data as { token: string };
  if (!token) throw new HttpsError('invalid-argument', 'Token required');

  await db.collection(COLLECTIONS.USERS).doc(request.auth.uid).update({
    fcmToken: token,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ─── Reset Delivery Partner Password (admin) ─────────────────────────

export const resetDeliveryPartnerPassword = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const caller = await db.collection(COLLECTIONS.USERS).doc(request.auth.uid).get();
  if (caller.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Admin only');

  const { userId, newPassword } = request.data as { userId: string; newPassword: string };
  if (!newPassword || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }

  await auth.updateUser(userId, { password: newPassword });
  return { success: true };
});

// ─── Subscription Expiry Check (daily) ─────────────────────────────

export const subscriptionExpiryCheck = onSchedule('0 5 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];

  const subsSnap = await db
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('active', '==', true)
    .where('endDate', '<', today)
    .get();

  for (const subDoc of subsSnap.docs) {
    const sub = subDoc.data();
    await subDoc.ref.update({
      active: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await notifyUser(
      sub.customerId,
      'Subscription Expired',
      `Your ${sub.productName} subscription has ended. Contact us to renew.`,
      'subscription_expired',
      { subscriptionId: subDoc.id }
    );
  }

  console.log(`Deactivated ${subsSnap.size} expired subscriptions`);
});
