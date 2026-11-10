import Dexie, { Table } from 'dexie';
import { EmergencyReport } from '../types/report';

export interface QueuedOfflineReport {
  id: string; // client temporary ID
  reportData: any;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

export class EmergencyOfflineDatabase extends Dexie {
  offlineQueue!: Table<QueuedOfflineReport, string>;
  cachedReports!: Table<EmergencyReport, string>;

  constructor() {
    super('EmergencyReportingDB');
    this.version(1).stores({
      offlineQueue: 'id, queuedAt, retryCount',
      cachedReports: 'id, type, status, priorityTier, createdAt',
    });
  }
}

export const offlineDb = new EmergencyOfflineDatabase();
