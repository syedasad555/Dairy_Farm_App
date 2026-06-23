/**
 * Seeds Auth + Firestore for local emulator testing.
 * Run via: npm run emulators:seed (from firebase/)
 *
 * Test accounts (mobile / password):
 *   Admin:    9999999999 / admin123
 *   Customer: 9876543210 / customer123  (pre-approved)
 *   Partner:  9888888888 / partner123
 */

const path = require('path');

// Prefer local firebase/ deps; fall back to functions/node_modules
let admin;
try {
  admin = require('firebase-admin');
} catch {
  admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'dairy-farm-121a6';
const AUTH_EMAIL_DOMAIN = 'mvrfarms.app';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

admin.initializeApp({ projectId: PROJECT_ID });

const db = admin.firestore();
const auth = admin.auth();

function authEmail(mobile) {
  return `${mobile.replace(/\D/g, '')}@${AUTH_EMAIL_DOMAIN}`;
}

async function upsertUser(mobile, password, profile) {
  const email = authEmail(mobile);
  let user;

  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName: profile.name });
  }

  await db.collection('users').doc(user.uid).set(
    {
      name: profile.name,
      mobile: mobile.replace(/\D/g, ''),
      email: profile.email ?? null,
      role: profile.role,
      status: profile.status,
      language: profile.language ?? 'english',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return user.uid;
}

async function seed() {
  console.log('Seeding emulator data for project:', PROJECT_ID);

  const adminId = await upsertUser('9999999999', 'admin123', {
    name: 'MVR Admin',
    role: 'admin',
    status: 'approved',
  });

  const customerId = await upsertUser('9876543210', 'customer123', {
    name: 'Test Customer',
    role: 'customer',
    status: 'approved',
    email: 'customer@test.com',
  });

  const partnerUserId = await upsertUser('9888888888', 'partner123', {
    name: 'Test Partner',
    role: 'delivery_partner',
    status: 'approved',
  });

  await db.collection('deliveryPartners').doc('dp_test_1').set({
    userId: partnerUserId,
    name: 'Test Partner',
    mobile: '9888888888',
    assignedPincodes: ['500001', '500002'],
    assignedAreaName: 'Hyderabad Central',
    active: true,
    totalDeliveries: 0,
    successfulDeliveries: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('addresses').doc('addr_test_1').set({
    userId: customerId,
    title: 'Home',
    houseNumber: '12',
    street: 'Main Road',
    village: 'Banjara Hills',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    latitude: 17.4126,
    longitude: 78.4477,
    isDefault: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const products = [
    {
      id: 'prod_milk_1',
      name: 'Cow Milk',
      category: 'Dairy',
      description: 'Fresh farm cow milk',
      image: '',
      variants: [
        { name: '500ml', price: 30, quantity: '500ml' },
        { name: '1L', price: 55, quantity: '1L' },
      ],
      stock: 100,
      active: true,
    },
    {
      id: 'prod_ghee_1',
      name: 'Pure Ghee',
      category: 'Dairy',
      description: 'Traditional churned ghee',
      image: '',
      variants: [{ name: '500g', price: 450, quantity: '500g' }],
      stock: 50,
      active: true,
    },
    {
      id: 'prod_eggs_1',
      name: 'Farm Eggs',
      category: 'Poultry',
      description: 'Free-range egg pack',
      image: '',
      variants: [{ name: '6 Pack', price: 60, quantity: '6' }],
      stock: 80,
      active: true,
    },
  ];

  for (const product of products) {
    const { id, ...data } = product;
    await db.collection('products').doc(id).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await db.collection('settings').doc('app').set({
    morningSlotStart: '04:00',
    morningSlotEnd: '08:00',
    eveningSlotStart: '16:00',
    eveningSlotEnd: '20:00',
    deliveryRadiusKm: 2,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\nSeed complete. Test logins (mobile / password):');
  console.log('  Admin:    9999999999 / admin123');
  console.log('  Customer: 9876543210 / customer123');
  console.log('  Partner:  9888888888 / partner123');
  console.log('\nAdmin UID:', adminId);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
