"use strict";
/**
 * Seed script — run once to create admin user
 * Usage: npx ts-node src/scripts/seedAdmin.ts
 *
 * Set environment variables:
 *   ADMIN_MOBILE=9876543210
 *   ADMIN_PASSWORD=admin123
 *   ADMIN_NAME=Admin
 */
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
const admin = __importStar(require("firebase-admin"));
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
    }
    catch {
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
//# sourceMappingURL=seedAdmin.js.map