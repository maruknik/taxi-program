"""
WebSocket service for sending real-time updates.
"""

import json
import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


class WebSocketService:
    """Service for sending WebSocket messages."""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def send_ride_status_update(self, ride_id: str, status: str, extra_data: dict = None):
        """Send ride status update to all connected clients."""
        if not self.channel_layer:
            logger.warning("Channel layer not configured")
            return
        
        group_name = f'ride_{ride_id}'
        data = {
            'ride_id': ride_id,
            'status': status,
            'timestamp': timezone.now().isoformat(),
            **(extra_data or {})
        }
        
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'ride_status_update',
                'data': data
            }
        )
        
        logger.info(f"Sent ride status update: {ride_id} -> {status}")
    
    def send_driver_location_update(self, ride_id: str, location_data: dict):
        """Send driver location update."""
        if not self.channel_layer:
            return
        
        group_name = f'ride_{ride_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'driver_location_update',
                'data': {
                    'ride_id': ride_id,
                    'location': location_data,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
    
    def send_eta_update(self, ride_id: str, eta_minutes: int):
        """Send ETA update."""
        if not self.channel_layer:
            return
        
        group_name = f'ride_{ride_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'eta_update',
                'data': {
                    'ride_id': ride_id,
                    'eta_minutes': eta_minutes,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )
    
    def send_driver_message(self, ride_id: str, message: str, sender_type: str = 'driver'):
        """Send message from driver to passenger or vice versa."""
        if not self.channel_layer:
            return
        
        group_name = f'ride_{ride_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'driver_message',
                'data': {
                    'ride_id': ride_id,
                    'message': message,
                    'sender_type': sender_type,
                    'timestamp': timezone.now().isoformat()
                }
            }
        )


    def send_new_ride_to_driver(self, driver_id: str, ride_data: dict):
        """Send new ride assignment notification to driver."""
        if not self.channel_layer:
            logger.warning("Channel layer not configured")
            return

        group_name = f'driver_{driver_id}'

        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'new_ride_request',
                'data': {
                    **ride_data,
                    'timestamp': timezone.now().isoformat(),
                }
            }
        )
        logger.info(f"Sent new ride request to driver {driver_id}: ride {ride_data.get('id')}")

    def send_ride_cancelled_to_driver(self, driver_id: str, ride_id: str):
        """Notify driver that passenger cancelled the ride."""
        if not self.channel_layer:
            return

        group_name = f'driver_{driver_id}'

        async_to_sync(self.channel_layer.group_send)(
            group_name,
            {
                'type': 'ride_cancelled',
                'data': {
                    'ride_id': ride_id,
                    'timestamp': timezone.now().isoformat(),
                }
            }
        )
        logger.info(f"Sent ride_cancelled to driver {driver_id} for ride {ride_id}")


# Singleton instance
websocket_service = WebSocketService()
