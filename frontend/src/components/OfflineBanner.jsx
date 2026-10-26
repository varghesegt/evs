import { useState, useEffect } from 'react';
import { getSyncQueue, processSyncQueue } from '../utils/offlineSync';
import client from '../api/client';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowReconnectedAlert(true);
      setIsSyncing(true);
      try {
        await processSyncQueue(client);
        setPendingCount(getSyncQueue().length);
      } finally {
        setIsSyncing(false);
      }
      setTimeout(() => setShowReconnectedAlert(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedAlert(false);
    };

    const handleSyncUpdated = (e) => {
      setPendingCount(e.detail?.count ?? getSyncQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ecoshare_sync_updated', handleSyncUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ecoshare_sync_updated', handleSyncUpdated);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue(client);
      setPendingCount(getSyncQueue().length);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online and nothing just reconnected, don't take up screen space
  if (isOnline && !showReconnectedAlert && pendingCount === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Network connection status"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 600,
        backdropFilter: 'blur(10px)',
        backgroundColor: !isOnline
          ? 'rgba(234, 88, 12, 0.95)'
          : isSyncing
          ? 'rgba(37, 99, 235, 0.95)'
          : 'rgba(5, 150, 105, 0.95)',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: !isOnline ? '#ef4444' : isSyncing ? '#f59e0b' : '#10b981',
        }} />
        <span>
          {!isOnline
            ? `Offline Mode • Viewing cached data${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`
            : isSyncing
            ? 'Syncing offline records to cloud...'
            : 'Back online • All data synchronized'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pendingCount > 0 && isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '3px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
        {!isOnline && (
          <span style={{
            fontSize: '11px',
            background: 'rgba(0,0,0,0.2)',
            padding: '2px 8px',
            borderRadius: '999px'
          }}>
            PWA Ready
          </span>
        )}
      </div>
    </aside>
  );
}
