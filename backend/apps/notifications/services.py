"""
Business logic services for notifications app.
"""

import logging
import requests
from django.conf import settings
from django.utils import timezone
from apps.notifications.models import Notification, Device

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending push notifications and managing notifications."""
    
    @staticmethod
    def send_push_notification(user, title, message, data=None, notification_type=None, ride=None):
        """
        Send push notification to user's active devices.
        
        Args:
            user: User instance
            title: Notification title
            message: Notification message
            data: Additional data payload
            notification_type: Type of notification
            ride: Related ride instance
            
        Returns:
            dict: Results of sending notifications
        """
        if not data:
            data = {}
            
        # Get user's active devices
        devices = Device.objects.filter(user=user, is_active=True)
        
        if not devices:
            logger.warning(f"No active devices found for user {user.email}")
            return {'sent': 0, 'failed': 0, 'devices': []}
        
        results = {'sent': 0, 'failed': 0, 'devices': []}
        
        for device in devices:
            try:
                if device.device_type == Device.DeviceType.EXPO:
                    success = NotificationService._send_expo_notification(
                        device.registration_id, title, message, data
                    )
                else:
                    # For other device types (FCM, APNS) - implement as needed
                    logger.info(f"Device type {device.device_type} not implemented yet")
                    success = False
                
                if success:
                    results['sent'] += 1
                    results['devices'].append({'device_id': str(device.id), 'status': 'sent'})
                else:
                    results['failed'] += 1
                    results['devices'].append({'device_id': str(device.id), 'status': 'failed'})
                    
            except Exception as e:
                logger.error(f"Failed to send notification to device {device.id}: {e}")
                results['failed'] += 1
                results['devices'].append({'device_id': str(device.id), 'status': 'error'})
        
        # Create notification record
        Notification.objects.create(
            user=user,
            ride=ride,
            notification_type=notification_type or Notification.Type.RIDE_CREATED,
            title=title,
            message=message,
            data=data,
        )
        
        logger.info(f"Push notification sent to {user.email}: {results}")
        return results
    
    @staticmethod
    def _send_expo_notification(token, title, message, data=None):
        """
        Send notification via Expo Push API.
        
        Args:
            token: Expo push token
            title: Notification title
            message: Notification message
            data: Additional data payload
            
        Returns:
            bool: Success status
        """
        if not data:
            data = {}
            
        expo_push_url = 'https://exp.host/--/api/v2/push/send'
        
        payload = {
            'to': token,
            'sound': 'default',
            'title': title,
            'body': message,
            'data': data,
            'priority': 'high',
        }
        
        try:
            response = requests.post(
                expo_push_url,
                json=payload,
                headers={
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                timeout=10
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            if response_data.get('data') and len(response_data['data']) > 0:
                status = response_data['data'][0].get('status')
                if status == 'ok':
                    logger.info(f"Expo notification sent successfully to {token}")
                    return True
                else:
                    error = response_data['data'][0].get('message', 'Unknown error')
                    logger.error(f"Expo notification failed for {token}: {error}")
                    return False
            else:
                logger.error(f"Invalid Expo response: {response_data}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Expo API request failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Expo notification: {e}")
            return False
    
    @staticmethod
    def send_ride_notification(user, notification_type, ride, title=None, message=None, eta=None):
        """
        Send ride-related notification.
        
        Args:
            user: User instance
            notification_type: Type of ride notification
            ride: Ride instance
            title: Custom title (optional)
            message: Custom message (optional)
            eta: ETA in minutes (optional)
        """
        # Default messages based on type
        if not title or not message:
            title, message = NotificationService._get_ride_notification_content(
                notification_type, ride, eta
            )
        
        data = {
            'type': notification_type,
            'rideId': str(ride.id) if ride else None,
            'timestamp': timezone.now().isoformat(),
        }
        
        if eta:
            data['eta'] = eta
            
        return NotificationService.send_push_notification(
            user=user,
            title=title,
            message=message,
            data=data,
            notification_type=notification_type,
            ride=ride
        )
    
    @staticmethod
    def _get_ride_notification_content(notification_type, ride, eta=None):
        """Get default title and message for ride notifications."""
        driver_name = ride.driver.user.get_full_name() if ride and ride.driver else "Водій"
        
        content_map = {
            Notification.Type.RIDE_ACCEPTED: (
                f"{driver_name} прийняв ваше замовлення",
                f"{driver_name} прямує до точки відправлення"
            ),
            Notification.Type.DRIVER_ARRIVED: (
                "Водій прибув!",
                f"{driver_name} чекає на вас біля точки відправлення"
            ),
            Notification.Type.RIDE_STARTED: (
                "Поїздка розпочалась",
                f"{driver_name} везе вас до пункту призначення"
            ),
            Notification.Type.RIDE_COMPLETED: (
                "Поїздку завершено",
                "Дякуємо що скористались нашим сервісом!"
            ),
            Notification.Type.RIDE_CANCELLED: (
                "Поїздку скасовано",
                "На жаль, поїздку було скасовано"
            ),
        }
        
        if notification_type in content_map:
            title, message = content_map[notification_type]
            if eta and notification_type == Notification.Type.RIDE_ACCEPTED:
                message += f". Прибуття через {eta} хв"
            return title, message
        
        return "Оновлення поїздки", "Статус вашої поїздки змінено"
    
    @staticmethod
    def mark_all_read(user):
        """Mark all notifications as read for a user."""
        count = Notification.objects.filter(user=user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return count
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notifications count for a user."""
        return Notification.objects.filter(user=user, is_read=False).count()


class RideNotificationService:
    """Service for ride-specific notifications."""
    
    @classmethod
    def notify_eta_update(cls, ride, eta_minutes: int, title: str = None, message: str = None):
        """Notify user about ETA update with custom message."""
        
        if not title:
            title = f"Прибуває за {eta_minutes} хвилин"
        
        if not message:
            driver_name = ride.driver.user.first_name if ride.driver else "Водій"
            message = f"{driver_name} прямує до місця посадки. Час прибуття {eta_minutes} хв."
        
        return NotificationService.send_to_user(
            user=ride.user,
            notification_type=Notification.NotificationType.ETA_UPDATE,
            title=title,
            message=message,
            data={
                'type': 'eta_update',
                'rideId': str(ride.id),
                'eta': eta_minutes,
                'driverName': ride.driver.user.first_name if ride.driver else None,
                'timestamp': timezone.now().isoformat()
            },
            ride=ride
        )
    
    @classmethod
    def send_to_user(cls, user, notification_type, title, message, data=None, ride=None):
        """Send notification to user with specific type."""
        return NotificationService.send_push_notification(
            user=user,
            title=title,
            message=message,
            data=data,
            notification_type=notification_type,
            ride=ride
        )
