'use client';

import { useEffect, useState } from 'react';

/* eslint-disable no-undef */
// TypeScript type definitions for Service Worker API
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    };
  }
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return;
    }

    setStatus((prev) => ({ ...prev, isSupported: true }));

    // Register service worker
    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('[SW] Registering service worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service worker registered successfully:', registration);

      setStatus((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('[SW] Update found');
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[SW] Update available');
              setStatus((prev) => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data);

        if (event.data.type === 'CACHE_UPDATED') {
          // Handle cache updates
          console.log('[SW] Cache updated for:', event.data.url);
        }
      });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed - reloading page');
        window.location.reload();
      });
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
    }
  };

  const updateServiceWorker = async () => {
    if (!status.registration) {
      console.log('[SW] No registration available for update');
      return;
    }

    try {
      console.log('[SW] Updating service worker...');
      await status.registration.update();

      // Tell the new service worker to skip waiting
      if (status.registration.waiting) {
        status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('[SW] Service worker update failed:', error);
    }
  };

  const unregisterServiceWorker = async () => {
    if (!status.registration) {
      console.log('[SW] No registration to unregister');
      return;
    }

    try {
      console.log('[SW] Unregistering service worker...');
      const success = await status.registration.unregister();

      if (success) {
        console.log('[SW] Service worker unregistered successfully');
        setStatus({
          isSupported: true,
          isRegistered: false,
          isUpdateAvailable: false,
          registration: null,
        });
      }
    } catch (error) {
      console.error('[SW] Service worker unregistration failed:', error);
    }
  };

  return {
    status,
    updateServiceWorker,
    unregisterServiceWorker,
  };
}

export function ServiceWorkerRegistration() {
  const { status, updateServiceWorker } = useServiceWorker();

  if (!status.isSupported) {
    return null;
  }

  return (
    <>
      {/* Update notification */}
      {status.isUpdateAvailable && (
        <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">App Update Available</h3>
              <p className="text-sm opacity-90">
                A new version of the app is ready to install
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-400"
              >
                Later
              </button>
              <button
                onClick={updateServiceWorker}
                className="px-3 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 bg-gray-800 text-white p-2 rounded text-xs z-40">
          <div>SW: {status.isRegistered ? '✅' : '❌'}</div>
          <div>Update: {status.isUpdateAvailable ? '🔄' : '✅'}</div>
        </div>
      )}
    </>
  );
}

// Background sync helper
export function requestBackgroundSync(tag: string = 'background-sync') {
  if (
    'serviceWorker' in navigator &&
    'sync' in window.ServiceWorkerRegistration.prototype
  ) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register(tag);
      })
      .catch((error) => {
        console.error('[SW] Background sync registration failed:', error);
      });
  } else {
    console.log('[SW] Background sync not supported');
  }
}

// Send message to service worker
export function sendMessageToServiceWorker(message: any) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Get service worker version
export async function getServiceWorkerVersion(): Promise<string | null> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };

      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
      }

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  return null;
}
