"""
Serializers for ride history.
"""

from rest_framework import serializers
from apps.rides.models import Ride


class RideHistorySerializer(serializers.ModelSerializer):
    """Serializer for ride history list."""
    
    driver_info = serializers.SerializerMethodField()
    payment_info = serializers.SerializerMethodField()
    duration_text = serializers.ReadOnlyField()
    distance_text = serializers.ReadOnlyField()
    final_amount = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Ride
        fields = [
            'id', 'status', 'status_display', 'created_at', 'completed_at',
            'pickup_address', 'dropoff_address', 'pickup_location', 'dropoff_location',
            'distance_text', 'duration_text', 'final_amount',
            'driver_info', 'payment_info', 'user_rating', 'user_comment'
        ]

    def get_driver_info(self, obj):
        """Get driver information."""
        if not obj.driver:
            return None
        
        driver = obj.driver
        name = f"{driver.first_name} {driver.last_name}".strip() or driver.user.get_full_name() or driver.user.email
        return {
            'id': str(driver.id),
            'name': name,
            'rating': float(driver.rating) if driver.rating else 0.0,
            'total_rides': driver.total_rides,
            'phone': driver.user.phone_number or '',
            'vehicle': {
                'make': driver.vehicle_make,
                'model': driver.vehicle_model,
                'color': driver.vehicle_color,
                'plate': driver.vehicle_plate or '',
                'year': driver.vehicle_year,
            }
        }

    def get_payment_info(self, obj):
        """Get payment information."""
        # Use final_price or estimated_price for payment info
        amount = obj.final_price or obj.estimated_price
        return {
            'method': 'cash',  # Default to cash for now
            'display_name': 'Готівка',
            'amount': float(amount),
            'currency': 'UAH',
        }


class RideDetailSerializer(RideHistorySerializer):
    """Detailed serializer for single ride."""
    
    waypoint_locations = serializers.JSONField(read_only=True)
    route_polyline = serializers.CharField(read_only=True)
    
    class Meta(RideHistorySerializer.Meta):
        fields = RideHistorySerializer.Meta.fields + [
            'waypoint_locations', 'route_polyline', 'estimated_price',
            'pickup_notes', 'dropoff_notes', 'special_requests'
        ]


class RepeatRideSerializer(serializers.Serializer):
    """Serializer for repeating a ride."""
    
    ride_id = serializers.UUIDField()
    reverse_route = serializers.BooleanField(default=False)
    
    def validate_ride_id(self, value):
        """Validate ride exists and belongs to user."""
        try:
            ride = Ride.objects.get(id=value)
            if ride.user != self.context['request'].user:
                raise serializers.ValidationError("Ride does not belong to user")
            return value
        except Ride.DoesNotExist:
            raise serializers.ValidationError("Ride not found")
