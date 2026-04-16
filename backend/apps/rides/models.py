"""
Models for rides app.
"""

import uuid
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class RideManager(models.Manager):

    def get_queryset(self):
        return super().get_queryset().select_related('user', 'driver')

    def active(self):
        return self.filter(status__in=['pending', 'accepted', 'in_progress'])

    def for_user(self, user):
        return self.filter(user=user)

    def for_driver(self, driver):
        return self.filter(driver=driver)

    def completed(self):
        return self.filter(status='completed')

    def pending(self):
        return self.filter(status='pending')
    
    def completed_rides(self, user):
        """Get completed rides for user."""
        return self.for_user(user).select_related(
            'driver__user'
        ).filter(
            status__in=['completed', 'cancelled']
        ).order_by('-created_at')
    
    def with_payments(self):
        """Get rides with payment information."""
        return self.select_related('user', 'driver')


class Ride(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Очікує'
        ACCEPTED = 'accepted', 'Прийнята'
        IN_PROGRESS = 'in_progress', 'В дорозі'
        COMPLETED = 'completed', 'Завершена'
        CANCELLED = 'cancelled', 'Скасована'

    class VehicleType(models.TextChoices):
        ECONOMY = 'economy', 'Економ'
        COMFORT = 'comfort', 'Комфорт'
        BUSINESS = 'business', 'Бізнес'

    class CancellationReason(models.TextChoices):
        USER_CANCELLED = 'user_cancelled', 'Скасовано пасажиром'
        DRIVER_CANCELLED = 'driver_cancelled', 'Скасовано водієм'
        NO_DRIVERS = 'no_drivers', 'Немає водіїв'
        TIMEOUT = 'timeout', 'Час очікування сплив'
        OTHER = 'other', 'Інше'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        'users.User', on_delete=models.PROTECT, related_name='rides',
        verbose_name='Пасажир',
    )
    driver = models.ForeignKey(
        'drivers.Driver', on_delete=models.PROTECT,
        related_name='rides', null=True, blank=True,
        verbose_name='Водій',
    )

    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.PENDING, db_index=True,
        verbose_name='Статус',
    )
    vehicle_type = models.CharField(
        max_length=20, choices=VehicleType.choices,
        verbose_name='Тип авто',
    )

    pickup_location  = gis_models.PointField(geography=True, srid=4326, verbose_name='Координати посадки')
    dropoff_location = gis_models.PointField(geography=True, srid=4326, verbose_name='Координати висадки')
    pickup_address   = models.TextField(verbose_name='Адреса посадки')
    dropoff_address  = models.TextField(verbose_name='Адреса висадки')

    estimated_distance = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Очікувана відстань (км)')
    estimated_duration = models.IntegerField(verbose_name='Очікувана тривалість (хв)')
    estimated_price    = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Очікувана ціна')

    final_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Фактична відстань')
    final_duration = models.IntegerField(null=True, blank=True, verbose_name='Фактична тривалість')
    final_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Фактична ціна')

    discount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Знижка',
    )

    promo_code = models.ForeignKey(
        'payments.PromoCode', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='rides',
        verbose_name='Промокод',
    )

    rating = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оцінка',
    )
    user_comment = models.TextField(blank=True, verbose_name='Коментар пасажира')

    driver_rating_for_passenger = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оцінка пасажира водієм',
    )
    driver_comment_for_passenger = models.TextField(blank=True, verbose_name='Коментар водія про пасажира')

    cancellation_reason = models.CharField(
        max_length=50, choices=CancellationReason.choices, blank=True,
        verbose_name='Причина скасування',
    )
    cancellation_comment = models.TextField(blank=True, verbose_name='Коментар скасування')

    created_at   = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Створено')
    accepted_at  = models.DateTimeField(null=True, blank=True, verbose_name='Прийнято')
    started_at   = models.DateTimeField(null=True, blank=True, verbose_name='Розпочато')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Завершено')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='Скасовано')
    updated_at   = models.DateTimeField(auto_now=True, verbose_name='Оновлено')

    objects = RideManager()

    class Meta:
        db_table = 'rides'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['vehicle_type']),
        ]
        verbose_name = 'Поїздка'
        verbose_name_plural = 'Поїздки'

    def __str__(self):
        return f"Ride {self.id} ({self.status})"

    @property
    def duration_minutes(self) -> int | None:
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds() / 60)
        return None

    @property
    def is_active(self) -> bool:
        return self.status in [self.Status.PENDING, self.Status.ACCEPTED, self.Status.IN_PROGRESS]
    
    # Add rating field if not exists
    user_rating = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    user_comment = models.TextField(blank=True)
    
    @property
    def final_amount(self):
        """Get final paid amount."""
        return self.final_price or self.estimated_price
    
    @property
    def payment_method_display(self):
        """Get payment method display name."""
        return "Готівка"
    
    @property
    def duration_text(self):
        """Get human readable duration."""
        if not self.duration_minutes:
            return "—"
        
        hours = self.duration_minutes // 60
        minutes = self.duration_minutes % 60
        
        if hours > 0:
            return f"{hours}г {minutes}хв"
        return f"{minutes}хв"
    
    @property
    def distance_text(self):
        """Get human readable distance."""
        distance = self.final_distance or self.estimated_distance
        if not distance:
            return "—"
        return f"{float(distance):.1f} км"
    
VALID_STATUS_TRANSITIONS = {
    Ride.Status.PENDING: [Ride.Status.ACCEPTED, Ride.Status.CANCELLED],
    Ride.Status.ACCEPTED: [Ride.Status.IN_PROGRESS, Ride.Status.CANCELLED],
    Ride.Status.IN_PROGRESS: [Ride.Status.COMPLETED, Ride.Status.CANCELLED],
    Ride.Status.COMPLETED: [],
    Ride.Status.CANCELLED: [],
}


def validate_status_transition(current_status: str, new_status: str) -> bool:
    """Validate if status transition is allowed."""
    return new_status in VALID_STATUS_TRANSITIONS.get(current_status, [])