import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.rides.models import Ride
from apps.rides.serializers import (
    RideSerializer, RideCreateSerializer, PriceEstimateSerializer,
    RideCancelSerializer, RideRateSerializer, RatePassengerSerializer,
    ActiveRideForDriverSerializer,
)
from apps.rides.serializers_history import RideHistorySerializer, RideDetailSerializer, RepeatRideSerializer
from apps.rides.services import RideService, PricingService
from core.permissions import IsDriverUser

logger = logging.getLogger(__name__)


class RideViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Ride model."""

    serializer_class = RideSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_staff', False):
            return Ride.objects.all()
        elif getattr(user, 'is_driver', False):
            try:
                return Ride.objects.for_driver(user.driver_profile)
            except Exception:
                return Ride.objects.none()
        return Ride.objects.for_user(user)

    @action(detail=False, methods=['post'])
    def create_ride(self, request):
        """POST /api/v1/rides/create_ride/ — Create new ride."""
        serializer = RideCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        d = serializer.validated_data
        try:
            ride = RideService.create_ride(
                user=request.user,
                pickup_lat=d['pickup_lat'], pickup_lon=d['pickup_lon'],
                dropoff_lat=d['dropoff_lat'], dropoff_lon=d['dropoff_lon'],
                pickup_address=d['pickup_address'], dropoff_address=d['dropoff_address'],
                vehicle_type=d['vehicle_type'],
            )
            return Response(RideSerializer(ride).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def estimate(self, request):
        """POST /api/v1/rides/estimate/ — Price estimate."""
        serializer = PriceEstimateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        d = serializer.validated_data
        estimates = {}
        for vtype in ['economy', 'comfort', 'business']:
            estimates[vtype] = PricingService.get_price_estimate(
                d['pickup_lat'], d['pickup_lon'], d['dropoff_lat'], d['dropoff_lon'], vtype
            )
        return Response({'estimates': estimates})

    @action(detail=False, methods=['post'])
    def calculate_eta(self, request):
        """POST /api/v1/rides/calculate-eta/ — Calculate ETA between two points."""
        try:
            origin_lat = float(request.data.get('origin_lat'))
            origin_lng = float(request.data.get('origin_lng'))
            dest_lat = float(request.data.get('dest_lat'))
            dest_lng = float(request.data.get('dest_lng'))
            departure_time = request.data.get('departure_time', 'now')
            
            from .services.eta_service import ETAService
            eta_data = ETAService.calculate_detailed_eta(
                origin_lat, origin_lng, dest_lat, dest_lng, departure_time
            )
            
            if eta_data:
                return Response(eta_data)
            else:
                return Response(
                    {'error': 'Failed to calculate ETA'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except (ValueError, TypeError) as e:
            return Response(
                {'error': 'Invalid coordinates'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDriverUser])
    def accept(self, request, pk=None):
        """POST /api/v1/rides/{id}/accept/ — Driver accepts ride."""
        try:
            driver = request.user.driver_profile
            ride = RideService.accept_ride(pk, driver)
            
            # Надіслати WebSocket оновлення
            from .services.websocket_service import websocket_service
            websocket_service.send_ride_status_update(
                str(ride.id), 
                ride.status,
                {'driver_id': str(driver.id)}
            )
            
            return Response(RideSerializer(ride).data)
        except (ValueError, Exception) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDriverUser])
    def start(self, request, pk=None):
        """POST /api/v1/rides/{id}/start/ — Driver starts ride."""
        try:
            driver = request.user.driver_profile
            ride = RideService.start_ride(pk, driver)
            
            # Надіслати WebSocket оновлення
            from .services.websocket_service import websocket_service
            websocket_service.send_ride_status_update(
                str(ride.id), 
                ride.status
            )
            
            return Response(RideSerializer(ride).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDriverUser])
    def complete(self, request, pk=None):
        """POST /api/v1/rides/{id}/complete/ — Driver completes ride."""
        try:
            driver = request.user.driver_profile
            distance = request.data.get('actual_distance_km')
            ride = RideService.complete_ride(pk, driver, float(distance) if distance else None)
            
            # Надіслати WebSocket оновлення
            from .services.websocket_service import websocket_service
            websocket_service.send_ride_status_update(
                str(ride.id), 
                ride.status
            )
            
            return Response(RideSerializer(ride).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """POST /api/v1/rides/{id}/cancel/ — Cancel ride."""
        serializer = RideCancelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            ride = RideService.cancel_ride(
                pk, request.user,
                serializer.validated_data.get('reason', 'cancelled_by_user'),
                serializer.validated_data.get('comment', '')
            )
            # Notify driver via WebSocket if one was assigned
            if ride.driver:
                try:
                    from .services.websocket_service import websocket_service
                    websocket_service.send_ride_cancelled_to_driver(str(ride.driver.id), str(ride.id))
                except Exception:
                    pass
            return Response(RideSerializer(ride).data)
        except ValueError as e:
             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDriverUser])
    def rate_passenger(self, request, pk=None):
        """POST /api/v1/rides/{id}/rate_passenger/ — Driver rates the passenger."""
        serializer = RatePassengerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            driver = request.user.driver_profile
            ride = RideService.rate_passenger(
                pk, driver,
                serializer.validated_data['rating'],
                serializer.validated_data.get('comment', '')
            )
            return Response(RideSerializer(ride).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDriverUser])
    def reject(self, request, pk=None):
        """POST /api/v1/rides/{id}/reject/ — Driver rejects the assigned ride."""
        try:
            driver = request.user.driver_profile
            ride = RideService.reject_ride(pk, driver)
            return Response(RideSerializer(ride).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /api/v1/rides/active/ — Current active ride for the passenger.

        Used by client app to restore ride state after app restart/crash.
        Returns the single active ride or 404.
        """
        ride = Ride.objects.filter(
            user=request.user,
            status__in=[
                Ride.Status.PENDING,
                Ride.Status.ACCEPTED,
                Ride.Status.IN_PROGRESS,
            ]
        ).order_by('-created_at').first()

        if ride is None:
            return Response(
                {'error': 'No active ride'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(RideSerializer(ride).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsDriverUser])
    def active_for_driver(self, request):
        """
        GET /api/v1/rides/active_for_driver/ — Current active ride for the driver.

        Used for polling from the driver app (every 3-5 seconds).
        Returns the single active ride or null.
        """
        try:
            driver = request.user.driver_profile
        except Exception:
            return Response({'error': 'Driver profile not found'}, status=status.HTTP_404_NOT_FOUND)

        ride = Ride.objects.filter(
            driver=driver,
            status__in=[Ride.Status.ACCEPTED, Ride.Status.IN_PROGRESS]
        ).first()

        if ride is None:
            return Response({'ride': None})

        return Response({'ride': ActiveRideForDriverSerializer(ride).data})
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        GET /api/v1/rides/{id}/status/ — Lightweight status polling endpoint.
        
        Used by mobile clients to poll ride status every few seconds.
        Returns minimal data to reduce payload size.
        """
        try:
            ride = Ride.objects.get(id=pk)

            # Permission: only ride user, assigned driver, or admin
            user = request.user
            if (user != ride.user and
                    (not hasattr(user, 'driver_profile') or ride.driver != user.driver_profile) and
                    not getattr(user, 'is_staff', False)):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            data = {
                'id': str(ride.id),
                'status': ride.status,
                'driver_location': None,
            }

            # Include driver location if ride is active
            if ride.driver and ride.status in ['accepted', 'in_progress']:
                from apps.drivers.services import LocationCacheService
                cached = LocationCacheService.get_driver_location(str(ride.driver.id))
                if cached:
                    data['driver_location'] = {
                        'latitude': cached['lat'],
                        'longitude': cached['lon'],
                    }
                elif ride.driver.current_location:
                    data['driver_location'] = {
                        'latitude': ride.driver.current_location.y,
                        'longitude': ride.driver.current_location.x,
                    }

            return Response(data)
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def driver_location(self, request, pk=None):
        """GET /api/v1/rides/{id}/driver-location/ — Get driver location for ride."""
        ride = self.get_object()
        
        # Перевірити права доступу
        if (request.user != ride.user and 
            (not hasattr(request.user, 'driver_profile') or ride.driver != request.user.driver_profile)):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if not ride.driver or not ride.driver.current_location:
            return Response(
                {'error': 'Driver location not available'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Перевірити чи локація не застаріла
        from datetime import timedelta
        from django.utils import timezone
        
        if ride.driver.location_updated_at:
            time_diff = timezone.now() - ride.driver.location_updated_at
            if time_diff > timedelta(minutes=2):
                return Response(
                    {'error': 'Driver location is stale'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response({
            'latitude': ride.driver.current_location.y,
            'longitude': ride.driver.current_location.x,
            'heading': ride.driver.heading,
            'speed': ride.driver.speed,
            'updated_at': ride.driver.location_updated_at.isoformat()
        })

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """POST /api/v1/rides/{id}/rate/ — Rate completed ride."""
        serializer = RideRateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            ride = RideService.rate_ride(
                pk, request.user,
                serializer.validated_data['rating'],
                serializer.validated_data.get('comment', '')
            )
            return Response(RideSerializer(ride).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """GET /api/v1/rides/history/ — Get user's ride history."""
        
        rides = Ride.objects.completed_rides(request.user)
        
        # Pagination
        page = self.paginate_queryset(rides)
        if page is not None:
            serializer = RideHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = RideHistorySerializer(rides, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        """GET /api/v1/rides/{id}/detail/ — Get detailed ride information."""
        
        ride = self.get_object()
        
        # Check permissions
        if ride.user != request.user:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RideDetailSerializer(ride)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def repeat(self, request):
        """POST /api/v1/rides/repeat/ — Repeat a previous ride."""
        
        serializer = RepeatRideSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                original_ride = Ride.objects.get(id=serializer.validated_data['ride_id'])
                reverse_route = serializer.validated_data['reverse_route']
                
                # Create new ride based on original
                new_ride_data = {
                    'pickup_location': original_ride.dropoff_location if reverse_route else original_ride.pickup_location,
                    'pickup_address': original_ride.dropoff_address if reverse_route else original_ride.pickup_address,
                    'dropoff_location': original_ride.pickup_location if reverse_route else original_ride.dropoff_location,
                    'dropoff_address': original_ride.pickup_address if reverse_route else original_ride.dropoff_address,
                    'waypoint_locations': list(reversed(original_ride.waypoint_locations or [])) if reverse_route else original_ride.waypoint_locations,
                    'vehicle_type': original_ride.vehicle_type,
                    'special_requests': original_ride.special_requests,
                }
                
                # Use existing ride creation logic
                new_ride = RideService.create_ride(
                    user=request.user,
                    **new_ride_data
                )
                
                return Response(RideSerializer(new_ride).data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)