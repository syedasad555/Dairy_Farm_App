/**
 * Seed script — run once to create admin user
 * Usage: npx ts-node src/scripts/seedAdmin.ts
 *
 * Set environment variables:
 *   ADMIN_MOBILE=9876543210
 *   ADMIN_PASSWORD=admin123
 *   ADMIN_NAME=Admin
 */

import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

async function seedAdmin() {
  const mobile = process.env.ADMIN_MOBILE ?? '9999999999';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.ADMIN_NAME ?? 'MVR Admin';
  const email = `${mobile.replace(/\D/g, '')}@mvrfarms.app`;

  try {
    const existing = await auth.getUserByEmail(email);
    console.log('Admin already exists:', existing.uid);
    return;
  } catch {
    // User doesn't exist, create
  }

  const user = await auth.createUser({ email, password, displayName: name });

  await db.collection('users').doc(user.uid).set({
    name,
    mobile: mobile.replace(/\D/g, ''),
    role: 'admin',
    status: 'approved',
    language: 'english',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Admin created successfully');
  console.log('  UID:', user.uid);
  console.log('  Mobile:', mobile);
  console.log('  Email (auth):', email);
}

seedAdmin().catch(console.error);
