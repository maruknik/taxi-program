"""
Extended models for ride history functionality.
"""

from django.db import models
from django.db.models import Manager
from django.core.validators import MinValueValidator, MaxValueValidator


class RideManager(Manager):
    def for_user(self, user):
        """Get rides for specific user."""
        return self.filter(user=user).select_related(
            'driver__user', 'payment_method'
        ).prefetch_related('transactions')
    
    def completed_rides(self, user):
        """Get completed rides for user."""
        return self.for_user(user).filter(
            status__in=['completed', 'cancelled']
        ).order_by('-created_at')
    
    def with_payments(self):
        """Get rides with payment information."""
        return self.prefetch_related('transactions__payment_method')


# Extend the existing Ride model with additional properties
# These will be added to the existing Ride model in models.py
class RideHistoryMixin(models.Model):
    """Mixin for ride history functionality."""
    
    # Add rating field if not exists
    user_rating = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    user_comment = models.TextField(blank=True)
    
    class Meta:
        abstract = True
    
    @property
    def final_amount(self):
        """Get final paid amount from transactions."""
        completed_transaction = self.transactions.filter(
            status='completed',
            type='payment'
        ).first()
        return completed_transaction.amount if completed_transaction else self.estimated_price
    
    @property
    def payment_method_display(self):
        """Get payment method display name."""
        transaction = self.transactions.filter(
            status='completed',
            type='payment'
        ).first()
        if transaction and transaction.payment_method:
            return transaction.payment_method.display_name
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
        if not self.distance_km:
            return "—"
        return f"{self.distance_km:.1f} км"
