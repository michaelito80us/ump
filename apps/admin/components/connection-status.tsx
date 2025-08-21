'use client';

import React from 'react';
import { useConnectionStatus } from '../hooks/use-realtime';
import { ConnectionState } from '../lib/websocket-config';
import { Badge, Button } from '@ump/ui';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
  showReconnectButton?: boolean;
  compact?: boolean;
}

export function ConnectionStatus({
  className,
  showReconnectButton = true,
  compact = false,
}: ConnectionStatusProps) {
  const { connectionState, isConnected, lastError, reconnect } =
    useConnectionStatus();

  const getStatusConfig = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'success' as const,
          color: 'text-green-600',
        };
      case ConnectionState.CONNECTING:
        return {
          icon: RefreshCw,
          label: 'Connecting...',
          variant: 'secondary' as const,
          color: 'text-yellow-600',
          animate: true,
        };
      case ConnectionState.DISCONNECTED:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'secondary' as const,
          color: 'text-gray-600',
        };
      case ConnectionState.ERROR:
        return {
          icon: AlertCircle,
          label: 'Connection Error',
          variant: 'destructive' as const,
          color: 'text-red-600',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Unknown',
          variant: 'secondary' as const,
          color: 'text-gray-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Icon
          className={`h-4 w-4 ${config.color} ${
            config.animate ? 'animate-spin' : ''
          }`}
        />
        {!isConnected && showReconnectButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reconnect}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${config.color} ${
            config.animate ? 'animate-spin' : ''
          }`}
        />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {lastError && (
        <div
          className="text-xs text-red-600 max-w-xs truncate"
          title={lastError}
        >
          {lastError}
        </div>
      )}

      {!isConnected && showReconnectButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

// Floating connection status indicator for global use
export function FloatingConnectionStatus() {
  const { isConnected } = useConnectionStatus();

  // Only show when not connected
  if (isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <ConnectionStatus compact showReconnectButton />
      </div>
    </div>
  );
}

// Header connection status for navigation bars
export function HeaderConnectionStatus() {
  return (
    <div className="flex items-center">
      <ConnectionStatus compact className="mr-4" />
    </div>
  );
}
