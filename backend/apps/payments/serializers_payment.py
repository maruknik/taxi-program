"""
Serializers for payment processing.
"""

from rest_framework import serializers
from decimal import Decimal


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intent."""
    ride_id = serializers.UUIDField()
    payment_method_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))


class PaymentConfirmationSerializer(serializers.Serializer):
    """Serializer for payment confirmation."""
    payment_intent_id = serializers.CharField()
    payment_method_id = serializers.CharField()


class RefundSerializer(serializers.Serializer):
    """Serializer for creating refund."""
    amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=Decimal('0.01'),
        required=False,
        help_text="Refund amount. If not provided, full refund will be processed."
    )
    reason = serializers.CharField(
        max_length=500,
        required=False,
        default="Customer refund"
    )
