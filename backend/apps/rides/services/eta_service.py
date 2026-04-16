"""
Enhanced ETA calculation service with traffic awareness.
"""

import logging
import requests
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from apps.notifications.services import RideNotificationService

logger = logging.getLogger(__name__)


class ETAService:
    """Enhanced service for calculating and updating ETA."""
    
    # Cache settings
    CACHE_DURATION = 60  # 1 minute
    SIGNIFICANT_CHANGE_THRESHOLD = 3  # minutes
    NOTIFICATION_COOLDOWN = 300  # 5 minutes between ETA notifications
    
    @classmethod
    def calculate_detailed_eta(
        cls,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        departure_time: str = 'now'
    ) -> Optional[Dict[str, Any]]:
        """Calculate detailed ETA with traffic information."""
        
        cache_key = f"eta_{origin_lat}_{origin_lng}_{dest_lat}_{dest_lng}_{departure_time}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            logger.debug(f"Using cached ETA result for {cache_key}")
            return cached_result
        
        try:
            api_key = settings.GOOGLE_MAPS_API_KEY
            if not api_key:
                logger.error("Google Maps API key not configured")
                return None
            
            url = "https://maps.googleapis.com/maps/api/directions/json"
            params = {
                'origin': f"{origin_lat},{origin_lng}",
                'destination': f"{dest_lat},{dest_lng}",
                'mode': 'driving',
                'departure_time': departure_time,
                'traffic_model': 'best_guess',
                'alternatives': 'true',  # Get alternative routes
                'key': api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and data['routes']:
                    # Вибрати найкращий маршрут (зазвичай перший)
                    best_route = data['routes'][0]
                    leg = best_route['legs'][0]
                    
                    # Отримати детальну інформацію
                    result = {
                        'eta_minutes': cls._extract_eta_minutes(leg),
                        'distance_meters': leg['distance']['value'],
                        'distance_text': leg['distance']['text'],
                        'duration_seconds': leg['duration']['value'],
                        'duration_text': leg['duration']['text'],
                        'traffic_duration_seconds': None,
                        'traffic_duration_text': None,
                        'traffic_condition': 'unknown',
                        'polyline': best_route['overview_polyline']['points'],
                        'calculated_at': timezone.now().isoformat(),
                    }
                    
                    # Додати інформацію про трафік якщо доступна
                    if 'duration_in_traffic' in leg:
                        traffic_duration = leg['duration_in_traffic']['value']
                        result['traffic_duration_seconds'] = traffic_duration
                        result['traffic_duration_text'] = leg['duration_in_traffic']['text']
                        result['eta_minutes'] = max(1, round(traffic_duration / 60))
                        
                        # Визначити стан трафіку
                        normal_duration = leg['duration']['value']
                        traffic_ratio = traffic_duration / normal_duration
                        
                        if traffic_ratio < 1.2:
                            result['traffic_condition'] = 'light'
                        elif traffic_ratio < 1.5:
                            result['traffic_condition'] = 'moderate'
                        else:
                            result['traffic_condition'] = 'heavy'
                    
                    # Кешувати результат
                    cache.set(cache_key, result, cls.CACHE_DURATION)
                    
                    logger.info(f"Calculated ETA: {result['eta_minutes']} min, traffic: {result['traffic_condition']}")
                    return result
                else:
                    logger.error(f"Google Directions API error: {data.get('status')}")
                    return None
            else:
                logger.error(f"Google Directions API HTTP error: {response.status_code}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Network error calculating ETA: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calculating ETA: {e}")
            return None
    
    @classmethod
    def _extract_eta_minutes(cls, leg: Dict[str, Any]) -> int:
        """Extract ETA in minutes from route leg."""
        if 'duration_in_traffic' in leg:
            duration_seconds = leg['duration_in_traffic']['value']
        else:
            duration_seconds = leg['duration']['value']
        
        return max(1, round(duration_seconds / 60))
    
    @classmethod
    def update_eta_for_ride(cls, ride, force_notification: bool = False) -> Optional[Dict[str, Any]]:
        """Update ETA for a ride with intelligent notifications."""
        
        if not ride.driver or not ride.driver.current_location:
            return None
        
        # Визначити destination залежно від статусу поїздки
        if ride.status == 'accepted':
            dest_lat = ride.pickup_location.y
            dest_lng = ride.pickup_location.x
            destination_type = 'pickup'
        elif ride.status == 'in_progress':
            dest_lat = ride.dropoff_location.y
            dest_lng = ride.dropoff_location.x
            destination_type = 'dropoff'
        else:
            return None
        
        # Розрахувати детальний ETA
        eta_data = cls.calculate_detailed_eta(
            origin_lat=ride.driver.current_location.y,
            origin_lng=ride.driver.current_location.x,
            dest_lat=dest_lat,
            dest_lng=dest_lng
        )
        
        if not eta_data:
            return None
        
        # Отримати попередній ETA
        cache_key = f"ride_eta_{ride.id}"
        previous_eta_data = cache.get(cache_key)
        
        # Зберегти новий ETA
        cache.set(cache_key, eta_data, 3600)  # 1 година
        
        # Перевірити чи потрібно надіслати notification
        should_notify = cls._should_send_eta_notification(
            ride, eta_data, previous_eta_data, force_notification
        )
        
        if should_notify:
            cls._send_eta_notification(ride, eta_data, destination_type)
        
        return eta_data
    
    @classmethod
    def _should_send_eta_notification(
        cls,
        ride,
        current_eta: Dict[str, Any],
        previous_eta: Optional[Dict[str, Any]],
        force: bool
    ) -> bool:
        """Determine if ETA notification should be sent."""
        
        if force:
            return True
        
        if not previous_eta:
            # Перша оцінка ETA
            return True
        
        # Перевірити cooldown
        cooldown_key = f"eta_notification_cooldown_{ride.id}"
        if cache.get(cooldown_key) and not force:
            return False
        
        current_minutes = current_eta['eta_minutes']
        previous_minutes = previous_eta['eta_minutes']
        
        # Значна зміна ETA
        eta_change = abs(current_minutes - previous_minutes)
        if eta_change >= cls.SIGNIFICANT_CHANGE_THRESHOLD:
            return True
        
        # Зміна трафікових умов
        current_traffic = current_eta.get('traffic_condition', 'unknown')
        previous_traffic = previous_eta.get('traffic_condition', 'unknown')
        
        if (current_traffic != previous_traffic and 
            current_traffic in ['moderate', 'heavy']):
            return True
        
        # ETA менше 5 хвилин і змінилося
        if current_minutes <= 5 and eta_change >= 1:
            return True
        
        return False
    
    @classmethod
    def _send_eta_notification(
        cls,
        ride,
        eta_data: Dict[str, Any],
        destination_type: str
    ):
        """Send ETA notification to user."""
        
        eta_minutes = eta_data['eta_minutes']
        traffic_condition = eta_data.get('traffic_condition', 'unknown')
        
        # Створити повідомлення залежно від ситуації
        if destination_type == 'pickup':
            if eta_minutes <= 2:
                title = "Водій вже на місці"
                message = f"Ваш водій прибув. Будь ласка, шукайте {ride.driver.vehicle_color} {ride.driver.vehicle_make} {ride.driver.vehicle_model} {ride.driver.vehicle_plate_number}"
            else:
                title = f"Прибуває за {eta_minutes} хвилин"
                driver_name = ride.driver.user.first_name
                message = f"{driver_name} прямує до місця посадки."
                
                if traffic_condition == 'heavy':
                    message += " Затримка через щільний трафік."
                elif traffic_condition == 'moderate':
                    message += " Час прибуття може збільшитися через трафік."
        else:  # dropoff
            title = f"До призначення {eta_minutes} хвилин"
            message = f"Орієнтовний час прибуття до місця призначення."
        
        # Надіслати notification
        RideNotificationService.notify_eta_update(ride, eta_minutes, title, message)
        
        # Встановити cooldown
        cooldown_key = f"eta_notification_cooldown_{ride.id}"
        cache.set(cooldown_key, True, cls.NOTIFICATION_COOLDOWN)
    
    @classmethod
    def get_cached_eta(cls, ride_id: str) -> Optional[Dict[str, Any]]:
        """Get cached ETA data for a ride."""
        cache_key = f"ride_eta_{ride_id}"
        return cache.get(cache_key)
    
    @classmethod
    def calculate_route_eta(
        cls,
        waypoints: list,
        optimize_waypoints: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Calculate ETA for multi-waypoint route."""
        
        if len(waypoints) < 2:
            return None
        
        try:
            api_key = settings.GOOGLE_MAPS_API_KEY
            if not api_key:
                return None
            
            origin = waypoints[0]
            destination = waypoints[-1]
            intermediate_waypoints = waypoints[1:-1] if len(waypoints) > 2 else []
            
            url = "https://maps.googleapis.com/maps/api/directions/json"
            params = {
                'origin': f"{origin['latitude']},{origin['longitude']}",
                'destination': f"{destination['latitude']},{destination['longitude']}",
                'mode': 'driving',
                'departure_time': 'now',
                'traffic_model': 'best_guess',
                'optimize_waypoints': optimize_waypoints,
                'key': api_key
            }
            
            if intermediate_waypoints:
                waypoints_str = '|'.join([
                    f"{wp['latitude']},{wp['longitude']}" 
                    for wp in intermediate_waypoints
                ])
                params['waypoints'] = waypoints_str
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and data['routes']:
                    route = data['routes'][0]
                    
                    total_duration = 0
                    total_distance = 0
                    
                    for leg in route['legs']:
                        if 'duration_in_traffic' in leg:
                            total_duration += leg['duration_in_traffic']['value']
                        else:
                            total_duration += leg['duration']['value']
                        
                        total_distance += leg['distance']['value']
                    
                    return {
                        'total_eta_minutes': max(1, round(total_duration / 60)),
                        'total_distance_meters': total_distance,
                        'total_duration_seconds': total_duration,
                        'polyline': route['overview_polyline']['points'],
                        'waypoint_order': route.get('waypoint_order', []),
                        'legs': [
                            {
                                'duration_minutes': max(1, round(
                                    (leg.get('duration_in_traffic', leg['duration']))['value'] / 60
                                )),
                                'distance_meters': leg['distance']['value'],
                                'start_address': leg['start_address'],
                                'end_address': leg['end_address'],
                            }
                            for leg in route['legs']
                        ]
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Error calculating route ETA: {e}")
            return None
