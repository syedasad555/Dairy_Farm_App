import * as admin from 'firebase-admin';

export interface OrderItemDoc {
  productId?: string;
  productName?: string;
  variantName?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
}

export interface OrderDoc {
  id: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: admin.firestore.Timestamp | string | Date;
  items?: OrderItemDoc[];
}

export function mapOrderDoc(doc: admin.firestore.QueryDocumentSnapshot): OrderDoc {
  return { id: doc.id, ...doc.data() } as OrderDoc;
}

export function getOrderCreatedIso(order: OrderDoc): string {
  const created = order.createdAt;
  if (created instanceof admin.firestore.Timestamp) {
    return created.toDate().toISOString();
  }
  if (created instanceof Date) {
    return created.toISOString();
  }
  return String(created ?? '');
}
