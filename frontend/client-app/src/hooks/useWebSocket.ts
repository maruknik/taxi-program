import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useRideStore } from '@/src/store/useRideStore';
import { WebSocketService } from '@/src/services/websocketService';

export function useRideWebSocket(rideId: string | null) {
  const wsRef = useRef<WebSocketService | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  
  const { 
    setRideStatus, 
    setDriverLocation, 
    setETA,
    updateRideData 
  } = useRideStore();

  useEffect(() => {
    if (!rideId) {
      disconnect();
      return;
    }

    connect(rideId);

    return () => {
      disconnect();
    };
  }, [rideId]);

  const connect = async (rideId: string) => {
    try {
      setError(null);
      
      // Створити WebSocket URL з токеном автентифікації
      const wsBaseUrl = process.env.EXPO_PUBLIC_WS_URL || 'ws://192.168.0.181:8000';
      
      // Отримати JWT токен з Clerk
      const token = await getToken() || '';
      
      const wsUrl = `${wsBaseUrl}/ws/rides/${rideId}/?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocketService({ url: wsUrl });

      // Налаштувати обробники повідомлень
      wsRef.current.onMessage('ride_status_update', handleRideStatusUpdate);
      wsRef.current.onMessage('driver_location_update', handleDriverLocationUpdate);
      wsRef.current.onMessage('eta_update', handleETAUpdate);
      wsRef.current.onMessage('driver_message', handleDriverMessage);
      wsRef.current.onMessage('ride_status', handleRideStatus);

      await wsRef.current.connect();
      setConnectionState('connected');
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setConnectionState('disconnected');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  };

  const handleRideStatusUpdate = (data: any) => {
    console.log('Ride status update:', data);
    setRideStatus(data.status);
    
    if (data.driver_id) {
      // Оновити інформацію про водія
      updateRideData({ driverId: data.driver_id });
    }
  };

  const handleDriverLocationUpdate = (data: any) => {
    console.log('Driver location update:', data);
    setDriverLocation(data.location);
  };

  const handleETAUpdate = (data: any) => {
    console.log('ETA update:', data);
    setETA(data.eta_minutes);
  };

  const handleDriverMessage = (data: any) => {
    console.log('Driver message:', data);
    // Показати повідомлення від водія
    // Можна використати toast або додати до store
  };

  const handleRideStatus = (data: any) => {
    console.log('Full ride status:', data);
    // Оновити повний стан поїздки
    updateRideData(data);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.isConnected) {
      wsRef.current.send(message);
    }
  };

  const requestStatus = () => {
    sendMessage({ type: 'request_status' });
  };

  return {
    connectionState,
    error,
    isConnected: connectionState === 'connected',
    sendMessage,
    requestStatus,
    reconnect: () => rideId && connect(rideId),
  };
}
