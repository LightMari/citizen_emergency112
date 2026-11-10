import { useState, useEffect } from 'react';
import { subscribeToSyncStatus, getPendingOfflineCount, processOfflineQueue } from '../services/syncManager';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    getPendingOfflineCount().then(setPendingCount);

    const unsubscribe = subscribeToSyncStatus((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerManualSync = async () => {
    return await processOfflineQueue();
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerManualSync,
  };
}
