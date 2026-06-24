import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/shared/constants';
import { mobileToAuthEmail } from '@/shared/utils/format';
import type { UserProfile, RegisterInput, Language } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  where,
} from './base.repository';

export class AuthRepository {
  async register(input: RegisterInput): Promise<FirebaseUser> {
    const email = mobileToAuthEmail(input.mobile);
    const credential = await createUserWithEmailAndPassword(auth, email, input.password);

    await createDocument(COLLECTIONS.USERS, credential.user.uid, {
      name: input.name,
      mobile: input.mobile.replace(/\D/g, ''),
      email: input.email || null,
      role: 'customer',
      status: 'pending',
      language: input.language,
    });

    return credential.user;
  }

  async login(mobile: string, password: string): Promise<FirebaseUser> {
    const email = mobileToAuthEmail(mobile);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    return getDocument<UserProfile>(COLLECTIONS.USERS, uid);
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDocument(COLLECTIONS.USERS, uid, data as Record<string, unknown>);
  }

  async updateFcmToken(uid: string, token: string): Promise<void> {
    await updateDocument(COLLECTIONS.USERS, uid, { fcmToken: token });
  }

  async getPendingCustomers(): Promise<UserProfile[]> {
    return queryDocuments<UserProfile>(
      COLLECTIONS.USERS,
      where('role', '==', 'customer'),
      where('status', '==', 'pending')
    );
  }

  async approveCustomer(uid: string): Promise<void> {
    await updateDocument(COLLECTIONS.USERS, uid, { status: 'approved' });
  }

  async rejectCustomer(uid: string): Promise<void> {
    await updateDocument(COLLECTIONS.USERS, uid, { status: 'rejected' });
  }

  async getAllCustomers(): Promise<UserProfile[]> {
    return queryDocuments<UserProfile>(
      COLLECTIONS.USERS,
      where('role', '==', 'customer'),
      where('status', '==', 'approved')
    );
  }

  async createDeliveryPartnerUser(
    name: string,
    mobile: string,
    password: string,
    language: Language = 'english'
  ): Promise<string> {
    const email = mobileToAuthEmail(mobile);
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await createDocument(COLLECTIONS.USERS, credential.user.uid, {
      name,
      mobile: mobile.replace(/\D/g, ''),
      role: 'delivery_partner',
      status: 'approved',
      language,
    });

    return credential.user.uid;
  }

  async resetPartnerPassword(mobile: string, newPassword: string): Promise<void> {
    const email = mobileToAuthEmail(mobile);
    await signInWithEmailAndPassword(auth, email, newPassword);
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const authRepository = new AuthRepository();
