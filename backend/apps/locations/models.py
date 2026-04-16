"""
Location and saved addresses models.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinLengthValidator

User = get_user_model()


class SavedAddress(models.Model):
    """Model for user's saved addresses."""
    
    class AddressType(models.TextChoices):
        HOME = 'home', 'Дім'
        WORK = 'work', 'Робота'
        FAVORITE = 'favorite', 'Обране'
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='saved_addresses'
    )
    
    type = models.CharField(
        max_length=10,
        choices=AddressType.choices
    )
    
    # Address information
    address = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(5)]
    )
    
    # Location coordinates
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7,
        null=True, 
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7,
        null=True, 
        blank=True
    )
    
    # Additional details
    entrance = models.CharField(max_length=10, blank=True)  # Підїзд
    floor = models.CharField(max_length=10, blank=True)     # Поверх
    apartment = models.CharField(max_length=10, blank=True) # Квартира
    notes = models.TextField(blank=True)                    # Додаткові нотатки
    
    # Custom name for favorites
    custom_name = models.CharField(max_length=100, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'type']  # One address per type per user
        ordering = ['type', 'created_at']
    
    def __str__(self):
        if self.custom_name:
            return f"{self.custom_name} ({self.address})"
        return f"{self.get_type_display()}: {self.address}"
    
    @property
    def display_name(self):
        """Get display name for the address."""
        if self.type == self.AddressType.FAVORITE and self.custom_name:
            return self.custom_name
        return self.get_type_display()
    
    @property
    def full_address(self):
        """Get full address with details."""
        parts = [self.address]
        
        if self.entrance:
            parts.append(f"під'їзд {self.entrance}")
        if self.floor:
            parts.append(f"поверх {self.floor}")
        if self.apartment:
            parts.append(f"кв. {self.apartment}")
            
        return ", ".join(parts)


class RecentAddress(models.Model):
    """Model for user's recent addresses."""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='recent_addresses'
    )
    
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7,
        null=True, 
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7,
        null=True, 
        blank=True
    )
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=1)
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'address']
        ordering = ['-last_used']
    
    def __str__(self):
        return f"{self.user.username}: {self.address}"
    
    @classmethod
    def add_or_update(cls, user, address, latitude=None, longitude=None):
        """Add or update recent address."""
        recent, created = cls.objects.get_or_create(
            user=user,
            address=address,
            defaults={
                'latitude': latitude,
                'longitude': longitude,
            }
        )
        
        if not created:
            recent.usage_count += 1
            recent.latitude = latitude or recent.latitude
            recent.longitude = longitude or recent.longitude
            recent.save()
        
        # Keep only last 20 recent addresses
        cls.objects.filter(user=user).exclude(id=recent.id)[19:].delete()
        
        return recent
