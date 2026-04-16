import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/expo';
import type { ActiveRide } from '@/types/ride.types';

const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://192.168.0.181:8000';

interface UseDriverWebSocketOptions {
  driverId: string | null;
  isOnline: boolean;
  onNewRide: (ride: ActiveRide) => void;
  onRideCancelled: (rideId: string) => void;
}

export function useDriverWebSocket({
  driverId,
  isOnline,
  onNewRide,
  onRideCancelled,
}: UseDriverWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);
  const { getToken } = useAuth();

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  const connect = useCallback(async () => {
    if (!driverId || !isOnline) return;
    disconnect();

    try {
      const token = await getToken();
      if (!token) return;

      const url = `${WS_BASE_URL}/ws/driver/${driverId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new_ride_request') {
            onNewRide(msg.data as ActiveRide);
          } else if (msg.type === 'ride_cancelled') {
            onRideCancelled(msg.data.ride_id);
          }
        } catch {
          // ignore malformed message
        }
      };

      ws.onerror = () => {
        isConnectedRef.current = false;
      };

      ws.onclose = () => {
        isConnectedRef.current = false;
        if (isOnline && driverId) {
          reconnectTimerRef.current = setTimeout(connect, 5000);
        }
      };
    } catch {
      if (isOnline && driverId) {
        reconnectTimerRef.current = setTimeout(connect, 5000);
      }
    }
  }, [driverId, isOnline, getToken, onNewRide, onRideCancelled, disconnect]);

  useEffect(() => {
    if (driverId && isOnline) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [driverId, isOnline]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, []);

  return { sendPing };
}
