"""
Views for payments app.
"""

import base64
import json
import logging
from decimal import Decimal

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.payments.models import Payment, PaymentMethod
from apps.payments.receipt_service import ReceiptService
from apps.payments.serializers import (
    CreatePaymentSerializer,
    PaymentSerializer,
    PaymentMethodSerializer,
    PromoCodeValidateSerializer,
)
from apps.payments.serializers_payment import PaymentIntentSerializer, RefundSerializer
from apps.payments.services import PaymentService, PromoCodeService, RefundService

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Payment model."""

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Payment.objects.none()
        if getattr(user, 'role', None) == 'admin':
            return Payment.objects.all()
        return Payment.objects.for_user(user)

    @action(detail=False, methods=['post'])
    def create_payment(self, request):
        """POST /api/v1/payments/create_payment/ — Initiate payment for ride."""
        serializer = CreatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ride_id = request.data.get('ride_id')
        if not ride_id:
            return Response(
                {'error': 'ride_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from apps.rides.models import Ride
            ride = Ride.objects.get(id=ride_id, user=request.user)
        except Ride.DoesNotExist:
            return Response(
                {'error': 'Ride not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            d = serializer.validated_data
            result = PaymentService.create_payment(
                ride=ride,
                user=request.user,
                payment_method=d['payment_method'],
                provider=d.get('provider', 'liqpay'),
                callback_url=d.get('callback_url', '') or '',
            )
            return Response(
                {
                    'payment': PaymentSerializer(result['payment']).data,
                    'payment_url': result.get('payment_url'),
                    'status': result['status'],
                },
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=['get'])
    def history(self, request):
        """GET /api/v1/payments/history/ — Payment history."""
        payments = PaymentService.get_user_payment_history(request.user)
        return Response(PaymentSerializer(payments, many=True).data)

    @action(detail=False, methods=['post'])
    def validate_promo(self, request):
        """POST /api/v1/payments/validate_promo/ — Validate promo code."""
        serializer = PromoCodeValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            discount, promo = PromoCodeService.validate_promo_code(
                serializer.validated_data['code'],
                Decimal(str(serializer.validated_data['ride_price'])),
            )
            return Response({
                'valid': True,
                'code': promo.code,
                'discount': float(discount),
                'discount_type': promo.discount_type,
            })
        except ValueError as e:
            return Response(
                {'valid': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """POST /api/v1/payments/{id}/refund/ — Request refund (admin or user)."""
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            reason = request.data.get('reason', '')

            if not amount or amount <= 0:
                return Response({'error': 'Valid amount required'}, status=status.HTTP_400_BAD_REQUEST)
            if not reason:
                return Response({'error': 'Reason required'}, status=status.HTTP_400_BAD_REQUEST)

            refund = RefundService.create_refund(pk, amount, reason)

            return Response({
                'refund_id': str(refund.id),
                'status': refund.status,
                'amount': float(refund.amount),
            })

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@require_http_methods(['POST'])
def liqpay_callback(request):
    """Webhook endpoint for LiqPay payment callbacks."""
    try:
        data = request.POST.get('data', '')
        signature = request.POST.get('signature', '')

        from apps.payments.providers.liqpay_provider import LiqPayProvider
        provider = LiqPayProvider()

        if not provider.verify_callback({'data': data}, signature):
            logger.warning("Invalid LiqPay callback signature")
            return JsonResponse({'error': 'Invalid signature'}, status=401)

        payload = json.loads(base64.b64decode(data).decode())
        order_id = payload.get('order_id')
        payment_status = payload.get('status')
        transaction_id = payload.get('payment_id')

        logger.info("LiqPay callback: order=%s, status=%s", order_id, payment_status)

        if payment_status in ('success', 'sandbox'):
            PaymentService.confirm_payment(order_id, str(transaction_id))
        elif payment_status in ('failure', 'error', 'reversed'):
            PaymentService.fail_payment(order_id, f"Provider status: {payment_status}")

        return JsonResponse({'status': 'ok'})

    except Exception as e:
        logger.error("LiqPay callback error: %s", e, exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def fondy_callback(request):
    """Webhook endpoint for Fondy payment callbacks."""
    try:
        payload = json.loads(request.body)
        response_data = payload.get('response', {})
        order_id = response_data.get('order_id')
        payment_status = response_data.get('order_status')

        logger.info("Fondy callback: order=%s, status=%s", order_id, payment_status)

        if payment_status == 'approved':
            PaymentService.confirm_payment(order_id)
        elif payment_status in ('declined', 'expired'):
            PaymentService.fail_payment(order_id, f"Provider status: {payment_status}")

        return JsonResponse({'status': 'ok'})

    except Exception as e:
        logger.error("Fondy callback error: %s", e, exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user payment methods."""
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user or not self.request.user.is_authenticated:
            return PaymentMethod.objects.none()
        return PaymentMethod.objects.filter(
            user=self.request.user,
            is_active=True
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def list_methods(self, request):
        """GET /api/v1/payments/payment-methods/ - Get user's payment methods."""
        methods = self.get_queryset()
        serializer = self.get_serializer(methods, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_card(self, request):
        """POST /api/v1/payments/payment-methods/add_card/ - Add new card."""
        from apps.payments.serializers import AddCardSerializer
        
        serializer = AddCardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        card_data = serializer.validated_data
        
        # Визначаємо тип картки (проста логіка)
        card_number = card_data['card_number']
        if card_number.startswith('4'):
            card_type = 'visa'
        elif card_number.startswith('5'):
            card_type = 'mastercard'
        else:
            card_type = 'unknown'

        # Якщо це перша картка, робимо її default
        is_default = not PaymentMethod.objects.filter(
            user=request.user,
            is_active=True
        ).exists()

        # Створюємо новий платіжний метод
        payment_method = PaymentMethod.objects.create(
            user=request.user,
            type='card',
            last_four_digits=card_number[-4:],
            card_type=card_type,
            expiry_month=card_data['expiry_month'],
            expiry_year=card_data['expiry_year'],
            is_default=is_default,
        )

        serializer = PaymentMethodSerializer(payment_method)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """POST /api/v1/payments/payment-methods/{id}/set_default/ - Set default payment method."""
        payment_method = self.get_object()
        
        # Прибираємо default з усіх методів користувача
        PaymentMethod.objects.filter(
            user=request.user,
            is_default=True
        ).update(is_default=False)
        
        # Встановлюємо новий default
        payment_method.is_default = True
        payment_method.save()
        
        serializer = self.get_serializer(payment_method)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove(self, request, pk=None):
        """POST /api/v1/payments/payment-methods/{id}/remove/ - Remove payment method."""
        payment_method = self.get_object()
        
        # Не дозволяємо видаляти default метод якщо є інші методи
        if payment_method.is_default:
            other_methods = PaymentMethod.objects.filter(
                user=request.user,
                is_active=True,
                is_default=False
            ).exists()
            
            if other_methods:
                return Response(
                    {'error': 'Не можна видалити платіжний метод за замовчуванням. Спочатку оберіть інший.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Деактивуємо метод (soft delete)
        payment_method.is_active = False
        payment_method.save()
        
        # Якщо видалили default, встановлюємо перший доступний як default
        if payment_method.is_default:
            remaining_methods = PaymentMethod.objects.filter(
                user=request.user,
                is_active=True,
                is_default=False
            ).first()
            
            if remaining_methods:
                remaining_methods.is_default = True
                remaining_methods.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def ensure_cash_method(self, request):
        """POST /api/v1/payments/payment-methods/ensure_cash/ - Ensure user has cash payment method."""
        cash_method, created = PaymentMethod.objects.get_or_create(
            user=request.user,
            type='cash',
            defaults={
                'is_default': not PaymentMethod.objects.filter(
                    user=request.user,
                    is_active=True,
                    is_default=True
                ).exists()
            }
        )
        
        if created:
            serializer = PaymentMethodSerializer(cash_method)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response({'message': 'Cash method already exists'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def process_ride_payment(self, request):
        """POST /api/v1/payments/payment-methods/process-ride-payment/ — Process payment for ride."""
        
        serializer = PaymentIntentSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                from apps.rides.models import Ride
                
                ride = Ride.objects.get(id=serializer.validated_data['ride_id'])
                payment_method = PaymentMethod.objects.get(
                    id=serializer.validated_data['payment_method_id']
                )
                amount = serializer.validated_data['amount']
                
                # Import payment processing service
                from apps.payments.services_payment import PaymentProcessingService
                
                result = PaymentProcessingService.process_ride_payment(
                    ride=ride,
                    payment_method=payment_method,
                    amount=amount
                )
                
                return Response(result)
                
            except Ride.DoesNotExist:
                return Response(
                    {'error': 'Ride not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except PaymentMethod.DoesNotExist:
                return Response(
                    {'error': 'Payment method not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """POST /api/v1/payments/payment-methods/{id}/confirm-payment/ — Confirm card payment."""
        
        try:
            payment = Payment.objects.get(id=pk)
            
            # Check permissions
            if payment.user != request.user:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Import payment processing service
            from apps.payments.services_payment import PaymentProcessingService
            
            result = PaymentProcessingService.confirm_card_payment(payment)
            return Response(result)
            
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def refund_payment(self, request, pk=None):
        """POST /api/v1/payments/payment-methods/{id}/refund/ — Refund payment."""
        
        try:
            payment = Payment.objects.get(id=pk)
            
            # Only staff can process refunds
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = RefundSerializer(data=request.data)
            if serializer.is_valid():
                refund_amount = serializer.validated_data.get('amount')
                
                # Import payment processing service
                from apps.payments.services_payment import PaymentProcessingService
                
                result = PaymentProcessingService.refund_payment(payment, refund_amount)
                return Response(result)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
