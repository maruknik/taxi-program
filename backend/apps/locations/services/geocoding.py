"""
Geocoding and address search services.
"""

import requests
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for geocoding and address search."""
    
    def __init__(self):
        self.google_api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
        self.base_url = 'https://maps.googleapis.com/maps/api'
    
    def search_addresses(self, query: str, country: str = 'UA') -> List[Dict[str, Any]]:
        """Search addresses using Google Places API."""
        
        if not self.google_api_key:
            logger.warning("Google Maps API key not configured")
            return []
        
        try:
            url = f"{self.base_url}/place/autocomplete/json"
            params = {
                'input': query,
                'components': f'country:{country}',
                'key': self.google_api_key,
                'language': 'uk'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.error(f"Places API error: {data.get('status')} - {data.get('error_message', '')}")
                return []
            
            results = []
            for prediction in data.get('predictions', []):
                results.append({
                    'address': prediction['description'],
                    'place_id': prediction['place_id'],
                    'description': prediction.get('structured_formatting', {}).get('main_text', ''),
                })
            
            return results
            
        except requests.RequestException as e:
            logger.error(f"Address search error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in address search: {e}")
            return []
    
    def geocode_address(self, address: str) -> Optional[Dict[str, Any]]:
        """Get coordinates for address using Google Geocoding API."""
        
        if not self.google_api_key:
            logger.warning("Google Maps API key not configured")
            return None
        
        try:
            url = f"{self.base_url}/geocode/json"
            params = {
                'address': address,
                'key': self.google_api_key,
                'language': 'uk'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.error(f"Geocoding API error: {data.get('status')} - {data.get('error_message', '')}")
                return None
            
            results = data.get('results', [])
            if not results:
                return None
            
            location = results[0]['geometry']['location']
            
            return {
                'latitude': location['lat'],
                'longitude': location['lng'],
                'formatted_address': results[0]['formatted_address'],
                'place_id': results[0].get('place_id'),
            }
            
        except requests.RequestException as e:
            logger.error(f"Geocoding error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in geocoding: {e}")
            return None
    
    def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a place."""
        
        if not self.google_api_key:
            logger.warning("Google Maps API key not configured")
            return None
        
        try:
            url = f"{self.base_url}/place/details/json"
            params = {
                'place_id': place_id,
                'fields': 'name,formatted_address,geometry,place_id',
                'key': self.google_api_key,
                'language': 'uk'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.error(f"Place details API error: {data.get('status')} - {data.get('error_message', '')}")
                return None
            
            result = data.get('result', {})
            location = result.get('geometry', {}).get('location', {})
            
            return {
                'address': result.get('formatted_address', ''),
                'latitude': location.get('lat'),
                'longitude': location.get('lng'),
                'place_id': result.get('place_id'),
                'name': result.get('name', ''),
            }
            
        except requests.RequestException as e:
            logger.error(f"Place details error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in place details: {e}")
            return None


# Global service instance
geocoding_service = GeocodingService()
