import { useEffect } from 'react';
import { useBudgetStore } from '../../store/budgetStore';
import { useNetworkStatus } from '../network';
import { syncPendingOperations } from '../sync';

export function useAutoSync() {
  const { isOnline } = useNetworkStatus();
  const { pendingOperations, removePendingOperation, clearPendingOperations } = useBudgetStore();

  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      console.log(`Syncing ${pendingOperations.length} pending operations...`);
      
      syncPendingOperations(
        pendingOperations,
        (id) => {
          console.log(`Successfully synced operation ${id}`);
          removePendingOperation(id);
        },
        (id) => {
          console.error(`Failed to sync operation ${id}`);
          // Keep failed operations for retry
        }
      );
    }
  }, [isOnline, pendingOperations.length, pendingOperations, removePendingOperation]);
}
