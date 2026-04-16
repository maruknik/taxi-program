"""
Location serializers.
"""

from rest_framework import serializers
from .models import SavedAddress, RecentAddress


class SavedAddressSerializer(serializers.ModelSerializer):
    """Serializer for saved addresses."""
    
    display_name = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    
    class Meta:
        model = SavedAddress
        fields = [
            'id', 'type', 'address', 'latitude', 'longitude',
            'entrance', 'floor', 'apartment', 'notes', 'custom_name',
            'display_name', 'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate saved address data."""
        user = self.context['request'].user
        address_type = data.get('type')
        
        # Check if user already has this type of address (for create)
        if not self.instance:
            existing = SavedAddress.objects.filter(
                user=user, 
                type=address_type,
                is_active=True
            ).exists()
            
            if existing:
                type_display = SavedAddress.AddressType(address_type).label
                raise serializers.ValidationError(
                    f"У вас вже є збережена адреса типу '{type_display}'"
                )
        
        # Validate custom name for favorites
        if address_type == SavedAddress.AddressType.FAVORITE:
            if not data.get('custom_name'):
                raise serializers.ValidationError(
                    "Для обраних адрес потрібно вказати назву"
                )
        
        return data
    
    def create(self, validated_data):
        """Create saved address."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CreateSavedAddressSerializer(serializers.Serializer):
    """Serializer for creating saved address with address search."""
    
    type = serializers.ChoiceField(choices=SavedAddress.AddressType.choices)
    address = serializers.CharField(max_length=255)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    entrance = serializers.CharField(max_length=10, required=False, allow_blank=True)
    floor = serializers.CharField(max_length=10, required=False, allow_blank=True)
    apartment = serializers.CharField(max_length=10, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    custom_name = serializers.CharField(max_length=100, required=False, allow_blank=True)


class RecentAddressSerializer(serializers.ModelSerializer):
    """Serializer for recent addresses."""
    
    class Meta:
        model = RecentAddress
        fields = [
            'id', 'address', 'latitude', 'longitude',
            'usage_count', 'last_used'
        ]
        read_only_fields = ['id', 'usage_count', 'last_used']


class AddressSearchSerializer(serializers.Serializer):
    """Serializer for address search results."""
    
    address = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    place_id = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
