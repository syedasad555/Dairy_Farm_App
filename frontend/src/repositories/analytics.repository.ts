import { COLLECTIONS } from '@/shared/constants';
import type { AnalyticsSnapshot } from '@/shared/types';
import { queryDocuments, getDocument, orderBy, limit } from './base.repository';

export class AnalyticsRepository {
  async getLatest(): Promise<AnalyticsSnapshot | null> {
    const docs = await queryDocuments<AnalyticsSnapshot>(
      COLLECTIONS.ANALYTICS,
      orderBy('date', 'desc'),
      limit(1)
    );
    return docs[0] ?? null;
  }

  async getRange(startDate: string, endDate: string): Promise<AnalyticsSnapshot[]> {
    const { where } = await import('./base.repository');
    return queryDocuments<AnalyticsSnapshot>(
      COLLECTIONS.ANALYTICS,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  }
}

export const analyticsRepository = new AnalyticsRepository();
