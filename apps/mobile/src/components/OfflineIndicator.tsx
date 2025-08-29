'use client';

import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        setShowOfflineMessage(true);
      } else if (showOfflineMessage) {
        // Show "back online" message briefly
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [showOfflineMessage]);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div
      data-testid="offline-indicator"
      className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium ${
        isOnline ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
      }`}
    >
      {isOnline
        ? 'Back online'
        : 'You are offline. Some features may be limited.'}
    </div>
  );
}
