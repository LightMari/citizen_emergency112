import { offlineDb } from './offlineDb';
import { getStoredReports, saveStoredReports } from './mockBackend';
import { EmergencyReport } from '../types/report';

export type SyncStatusListener = (isSyncing: boolean, pendingCount: number) => void;
const syncListeners: Set<SyncStatusListener> = new Set();

export function subscribeToSyncStatus(listener: SyncStatusListener) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function notifySync(isSyncing: boolean, pendingCount: number) {
  syncListeners.forEach((fn) => fn(isSyncing, pendingCount));
}

export async function getPendingOfflineCount(): Promise<number> {
  try {
    return await offlineDb.offlineQueue.count();
  } catch {
    return 0;
  }
}

export async function processOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    const count = await getPendingOfflineCount();
    notifySync(false, count);
    return { syncedCount: 0, errors: 0 };
  }

  notifySync(true, await getPendingOfflineCount());

  let syncedCount = 0;
  let errors = 0;

  try {
    const queue = await offlineDb.offlineQueue.toArray();
    if (queue.length === 0) {
      notifySync(false, 0);
      return { syncedCount: 0, errors: 0 };
    }

    const currentReports = getStoredReports();

    for (const item of queue) {
      try {
        const report: EmergencyReport = {
          ...item.reportData,
          syncStatus: 'synced',
          updatedAt: new Date().toISOString(),
        };

        // Add to stored reports
        currentReports.unshift(report);
        // Remove from offline queue
        await offlineDb.offlineQueue.delete(item.id);
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync item:', item.id, err);
        errors++;
      }
    }

    saveStoredReports(currentReports);
  } catch (err) {
    console.error('Error during offline queue sync processing', err);
    errors++;
  } finally {
    const remaining = await getPendingOfflineCount();
    notifySync(false, remaining);
  }

  return { syncedCount, errors };
}

// Auto-register listener when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('App came online. Triggering offline sync...');
    processOfflineQueue();
  });

  // Listen to service worker sync messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
        processOfflineQueue();
      }
    });
  }
}
