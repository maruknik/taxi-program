"""
Location views.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import SavedAddress, RecentAddress
from .serializers import (
    SavedAddressSerializer,
    CreateSavedAddressSerializer,
    RecentAddressSerializer,
    AddressSearchSerializer
)
from .services.geocoding import GeocodingService


class SavedAddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved addresses."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = SavedAddressSerializer
    
    def get_queryset(self):
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(self.request, 'user') and hasattr(self.request.user, 'is_anonymous'):
            if self.request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = self.request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        return SavedAddress.objects.filter(
            user=user,
            is_active=True
        )
    
    def create(self, request):
        """POST /api/v1/locations/saved-addresses/ — Create saved address."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        serializer = CreateSavedAddressSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Get coordinates if not provided
            if not data.get('latitude') or not data.get('longitude'):
                geocoding_service = GeocodingService()
                coords = geocoding_service.get_coordinates(data['address'])
                
                if coords:
                    data['latitude'] = coords['latitude']
                    data['longitude'] = coords['longitude']
            
            # Create saved address
            saved_address = SavedAddress.objects.create(
                user=user,
                **data
            )
            
            # Add to recent addresses
            RecentAddress.add_or_update(
                user=user,
                address=data['address'],
                latitude=data.get('latitude'),
                longitude=data.get('longitude')
            )
            
            serializer = SavedAddressSerializer(saved_address)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        """PUT/PATCH /api/v1/locations/saved-addresses/{id}/ — Update saved address."""
        
        saved_address = self.get_object()
        serializer = SavedAddressSerializer(
            saved_address, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """DELETE /api/v1/locations/saved-addresses/{id}/ — Delete saved address."""
        
        saved_address = self.get_object()
        saved_address.is_active = False
        saved_address.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """GET /api/v1/locations/saved-addresses/recent/ — Get recent addresses."""
        
        recent_addresses = RecentAddress.objects.filter(
            user=request.user
        )[:10]  # Limit to 10 most recent
        
        serializer = RecentAddressSerializer(recent_addresses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """GET /api/v1/locations/saved-addresses/search/ — Search addresses."""
        
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search in saved addresses
        saved_results = self.get_queryset().filter(
            Q(address__icontains=query) | 
            Q(custom_name__icontains=query)
        )
        
        # Search in recent addresses
        recent_results = RecentAddress.objects.filter(
            user=request.user,
            address__icontains=query
        )[:5]
        
        # Search using geocoding service
        geocoding_service = GeocodingService()
        geocoding_results = geocoding_service.search_addresses(query)
        
        # Combine results
        results = {
            'saved': SavedAddressSerializer(saved_results, many=True).data,
            'recent': RecentAddressSerializer(recent_results, many=True).data,
            'suggestions': AddressSearchSerializer(geocoding_results, many=True).data,
        }
        
        return Response(results)
    
    @action(detail=False, methods=['get'], url_path='by-type')
    def by_type(self, request):
        """GET /api/v1/locations/saved-addresses/by-type/ — Get addresses grouped by type."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        addresses = SavedAddress.objects.filter(
            user=user,
            is_active=True
        )
        
        grouped = {
            'home': None,
            'work': None,
            'favorites': []
        }
        
        for address in addresses:
            if address.type == SavedAddress.AddressType.HOME:
                grouped['home'] = SavedAddressSerializer(address).data
            elif address.type == SavedAddress.AddressType.WORK:
                grouped['work'] = SavedAddressSerializer(address).data
            elif address.type == SavedAddress.AddressType.FAVORITE:
                grouped['favorites'].append(SavedAddressSerializer(address).data)
        
        return Response(grouped)


class LocationViewSet(viewsets.ViewSet):
    """ViewSet for location-related operations."""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """GET /api/v1/locations/search/?q=query — Search addresses."""
        
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 3:
            return Response({
                'results': [],
                'message': 'Введіть принаймні 3 символи для пошуку'
            })
        
        geocoding_service = GeocodingService()
        results = geocoding_service.search_addresses(query)
        
        serializer = AddressSearchSerializer(results, many=True)
        return Response({
            'results': serializer.data,
            'count': len(results)
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """GET /api/v1/locations/recent/ — Get recent addresses."""
        
        recent_addresses = RecentAddress.objects.filter(
            user=request.user
        )[:10]  # Last 10 addresses
        
        serializer = RecentAddressSerializer(recent_addresses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def geocode(self, request):
        """POST /api/v1/locations/geocode/ — Get coordinates for address."""
        
        address = request.data.get('address')
        
        if not address:
            return Response(
                {'error': 'Address is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        geocoding_service = GeocodingService()
        coords = geocoding_service.get_coordinates(address)
        
        if coords:
            return Response(coords)
        else:
            return Response(
                {'error': 'Could not geocode address'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def reverse_geocode(self, request):
        """POST /api/v1/locations/reverse-geocode/ — Get address from coordinates."""
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response(
                {'error': 'Latitude and longitude are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        geocoding_service = GeocodingService()
        address = geocoding_service.reverse_geocode(latitude, longitude)
        
        if address:
            return Response({'address': address})
        else:
            return Response(
                {'error': 'Could not reverse geocode coordinates'}, 
                status=status.HTTP_404_NOT_FOUND
            )
