"""
Serializers for payments app.
"""

from rest_framework import serializers
from apps.payments.models import PromoCode, Payment, PaymentMethod


class PromoCodeValidateSerializer(serializers.Serializer):
    """Serializer for validating promo code."""
    code = serializers.CharField(max_length=50)
    ride_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for PromoCode model."""
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'discount_type', 'discount_percent',
            'discount_amount', 'min_ride_price', 'is_valid',
        ]
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    ride_id = serializers.UUIDField(source='ride.id', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'ride_id', 'user_email', 'amount', 'currency',
            'status', 'payment_method', 'provider',
            'provider_transaction_id', 'description',
            'created_at', 'processed_at',
        ]
        read_only_fields = fields


class CreatePaymentSerializer(serializers.Serializer):
    """Serializer for creating a payment."""
    payment_method = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    provider = serializers.ChoiceField(
        choices=Payment.Provider.choices, default='liqpay'
    )
    promo_code = serializers.CharField(required=False, allow_blank=True)
    callback_url = serializers.URLField(required=False, allow_blank=True)


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMethod model."""
    display_name = serializers.ReadOnlyField()

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'type',
            'display_name',
            'is_default',
            'last_four_digits',
            'card_type',
            'expiry_month',
            'expiry_year',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'display_name']


class AddCardSerializer(serializers.Serializer):
    """Serializer for adding a new card."""
    card_number = serializers.CharField(max_length=16, min_length=16)
    expiry_month = serializers.IntegerField(min_value=1, max_value=12)
    expiry_year = serializers.IntegerField(min_value=2024, max_value=2050)
    cvv = serializers.CharField(max_length=4, min_length=3)
    cardholder_name = serializers.CharField(max_length=100)

    def validate_card_number(self, value):
        # Проста валідація - тільки цифри
        if not value.isdigit():
            raise serializers.ValidationError("Номер картки повинен містити тільки цифри")
        
        # Luhn algorithm для валідації картки
        def luhn_checksum(card_number):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_number)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = 0
            checksum += sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d * 2))
            return checksum % 10

        if luhn_checksum(value) != 0:
            raise serializers.ValidationError("Недійсний номер картки")
        
        return value

    def validate_expiry_year(self, value):
        from datetime import datetime
        current_year = datetime.now().year
        if value < current_year:
            raise serializers.ValidationError("Термін дії картки не може бути в минулому")
        return value

    def validate(self, data):
        from datetime import datetime
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        # Перевірка чи термін дії не минув
        if (data['expiry_year'] == current_year and 
            data['expiry_month'] < current_month):
            raise serializers.ValidationError("Термін дії картки минув")
        
        return data
