"""
WebSocket consumers for rides app.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Ride

logger = logging.getLogger(__name__)
User = get_user_model()


class DriverConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for driver — receives new ride requests in real-time."""

    async def connect(self):
        self.driver_id = self.scope['url_route']['kwargs']['driver_id']
        self.group_name = f'driver_{self.driver_id}'

        query_string = self.scope.get('query_string', b'').decode()
        token = None
        if query_string:
            from urllib.parse import parse_qs
            params = parse_qs(query_string)
            token = params.get('token', [None])[0]

        user = None
        if token:
            try:
                from core.authentication import ClerkAuthentication
                auth = ClerkAuthentication()
                payload = auth._verify_token(token)
                get_user = database_sync_to_async(auth._get_or_create_user)
                user = await get_user(payload)
                self.scope['user'] = user
            except Exception as e:
                logger.error(f"Driver WS auth failed: {e}")

        if not user or not user.is_authenticated:
            await self.close()
            return

        # Verify that the authenticated user owns this driver profile
        is_owner = await self.check_driver_owner(user, self.driver_id)
        if not is_owner:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"Driver {self.driver_id} connected to driver WS")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Driver {self.driver_id} disconnected from driver WS")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong', 'timestamp': data.get('timestamp')}))
        except Exception as e:
            logger.error(f"DriverConsumer receive error: {e}")

    async def new_ride_request(self, event):
        """Push new ride assignment to driver."""
        await self.send(text_data=json.dumps({
            'type': 'new_ride_request',
            'data': event['data'],
        }))

    async def ride_cancelled(self, event):
        """Notify driver that ride was cancelled by passenger."""
        await self.send(text_data=json.dumps({
            'type': 'ride_cancelled',
            'data': event['data'],
        }))

    @database_sync_to_async
    def check_driver_owner(self, user, driver_id):
        try:
            from apps.drivers.models import Driver
            driver = Driver.objects.get(id=driver_id)
            return driver.user == user
        except Exception:
            return False


class RideConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for ride updates."""

    async def connect(self):
        """Handle WebSocket connection."""
        self.ride_id = self.scope['url_route']['kwargs']['ride_id']
        self.room_group_name = f'ride_{self.ride_id}'
        
        # Отримати токен з query parameters
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        if query_string:
            from urllib.parse import parse_qs
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
        
        # Авентифікувати користувача через токен
        user = None
        if token:
            try:
                from core.authentication import ClerkAuthentication
                auth = ClerkAuthentication()
                payload = auth._verify_token(token)
                get_user = database_sync_to_async(auth._get_or_create_user)
                user = await get_user(payload)
                
                # Додати користувача до scope
                self.scope['user'] = user
                
            except Exception as e:
                logger.error(f"JWT authentication failed: {e}")
        
        # Перевірити права доступу
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        # Перевірити що користувач має доступ до поїздки
        has_access = await self.check_ride_access(user, self.ride_id)
        if not has_access:
            await self.close()
            return

        # Приєднатися до групи
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Надіслати поточний статус поїздки
        await self.send_current_ride_status()
        
        logger.info(f"User {user.id} connected to ride {self.ride_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"Disconnected from ride {self.ride_id} with code {close_code}")

    async def receive(self, text_data):
        """Handle messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif message_type == 'request_status':
                await self.send_current_ride_status()
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {text_data}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def ride_status_update(self, event):
        """Handle ride status update from group."""
        await self.send(text_data=json.dumps({
            'type': 'ride_status_update',
            'data': event['data']
        }))

    async def driver_location_update(self, event):
        """Handle driver location update from group."""
        await self.send(text_data=json.dumps({
            'type': 'driver_location_update',
            'data': event['data']
        }))

    async def eta_update(self, event):
        """Handle ETA update from group."""
        await self.send(text_data=json.dumps({
            'type': 'eta_update',
            'data': event['data']
        }))

    async def driver_message(self, event):
        """Handle message from driver."""
        await self.send(text_data=json.dumps({
            'type': 'driver_message',
            'data': event['data']
        }))

    @database_sync_to_async
    def check_ride_access(self, user, ride_id):
        """Check if user has access to the ride."""
        try:
            ride = Ride.objects.get(id=ride_id)
            
            # Користувач поїздки або водій
            if user == ride.user:
                return True
            
            if hasattr(user, 'driver_profile') and ride.driver == user.driver_profile:
                return True
                
            # Адмін
            if getattr(user, 'is_staff', False):
                return True
                
            return False
        except Ride.DoesNotExist:
            return False

    @database_sync_to_async
    def get_ride_data(self):
        """Get current ride data."""
        try:
            ride = Ride.objects.select_related('user', 'driver__user').get(id=self.ride_id)
            
            data = {
                'id': str(ride.id),
                'status': ride.status,
                'pickup_location': {
                    'latitude': ride.pickup_location.y,
                    'longitude': ride.pickup_location.x,
                    'address': ride.pickup_address
                },
                'dropoff_location': {
                    'latitude': ride.dropoff_location.y,
                    'longitude': ride.dropoff_location.x,
                    'address': ride.dropoff_address
                },
                'estimated_price': float(ride.estimated_price),
                'created_at': ride.created_at.isoformat(),
            }
            
            # Додати інформацію про водія якщо є
            if ride.driver:
                driver = ride.driver
                driver_name = f"{driver.first_name} {driver.last_name}".strip() or driver.user.get_full_name() or driver.user.email
                data['driver'] = {
                    'id': str(driver.id),
                    'name': driver_name,
                    'phone': driver.user.phone_number or '',
                    'vehicle': {
                        'make': driver.vehicle_make,
                        'model': driver.vehicle_model,
                        'color': driver.vehicle_color,
                        'plate': driver.vehicle_plate or '',
                    }
                }
                
                # Додати локацію водія якщо доступна
                if ride.driver.current_location:
                    data['driver']['location'] = {
                        'latitude': ride.driver.current_location.y,
                        'longitude': ride.driver.current_location.x,
                        'heading': ride.driver.heading,
                        'speed': ride.driver.speed,
                        'updated_at': ride.driver.location_updated_at.isoformat() if ride.driver.location_updated_at else None
                    }
            
            return data
        except Ride.DoesNotExist:
            return None

    async def send_current_ride_status(self):
        """Send current ride status to client."""
        ride_data = await self.get_ride_data()
        if ride_data:
            await self.send(text_data=json.dumps({
                'type': 'ride_status',
                'data': ride_data
            }))
