"""
Advanced payment processing services.
"""

import logging
import uuid
import requests
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from .models import PaymentMethod

logger = logging.getLogger(__name__)


class PaymentGateway:
    """Base payment gateway interface."""
    
    def create_payment_intent(self, amount: Decimal, currency: str, metadata: Dict) -> Dict[str, Any]:
        raise NotImplementedError
    
    def confirm_payment(self, intent_id: str, payment_method: str) -> Dict[str, Any]:
        raise NotImplementedError
    
    def refund_payment(self, payment_id: str, amount: Decimal) -> Dict[str, Any]:
        raise NotImplementedError


class MockPaymentGateway(PaymentGateway):
    """Mock payment gateway for development."""
    
    def create_payment_intent(self, amount: Decimal, currency: str, metadata: Dict) -> Dict[str, Any]:
        """Create mock payment intent."""
        intent_id = f"pi_{uuid.uuid4().hex[:24]}"
        
        return {
            'id': intent_id,
            'client_secret': f"{intent_id}_secret_{uuid.uuid4().hex[:16]}",
            'amount': int(amount * 100),  # Convert to cents
            'currency': currency.lower(),
            'status': 'requires_confirmation',
            'metadata': metadata,
        }
    
    def confirm_payment(self, intent_id: str, payment_method: str) -> Dict[str, Any]:
        """Confirm mock payment."""
        # Simulate payment processing
        import random
        
        # 90% success rate for testing
        if random.random() < 0.9:
            return {
                'id': intent_id,
                'status': 'succeeded',
                'charges': {
                    'data': [{
                        'id': f"ch_{uuid.uuid4().hex[:24]}",
                        'status': 'succeeded',
                        'paid': True,
                    }]
                }
            }
        else:
            return {
                'id': intent_id,
                'status': 'failed',
                'last_payment_error': {
                    'code': 'card_declined',
                    'message': 'Your card was declined.',
                }
            }
    
    def refund_payment(self, payment_id: str, amount: Decimal) -> Dict[str, Any]:
        """Create mock refund."""
        return {
            'id': f"re_{uuid.uuid4().hex[:24]}",
            'status': 'succeeded',
            'amount': int(amount * 100),
        }


class LiqPayGateway(PaymentGateway):
    """LiqPay payment gateway integration."""
    
    def __init__(self):
        self.public_key = getattr(settings, 'LIQPAY_PUBLIC_KEY', '')
        self.private_key = getattr(settings, 'LIQPAY_PRIVATE_KEY', '')
        self.api_url = 'https://www.liqpay.ua/api/'
    
    def create_payment_intent(self, amount: Decimal, currency: str, metadata: Dict) -> Dict[str, Any]:
        """Create LiqPay payment."""
        import base64
        import hashlib
        import json
        
        order_id = f"order_{uuid.uuid4().hex[:16]}"
        
        data = {
            'version': '3',
            'public_key': self.public_key,
            'action': 'pay',
            'amount': float(amount),
            'currency': currency,
            'description': f"Taxi ride payment - {metadata.get('ride_id', '')}",
            'order_id': order_id,
            'result_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/payment/success",
            'server_url': f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/payments/liqpay/callback/",
        }
        
        data_encoded = base64.b64encode(json.dumps(data).encode()).decode()
        signature = self._generate_signature(data_encoded)
        
        return {
            'id': order_id,
            'data': data_encoded,
            'signature': signature,
            'checkout_url': f"{self.api_url}3/checkout",
            'status': 'requires_confirmation',
        }
    
    def _generate_signature(self, data: str) -> str:
        """Generate LiqPay signature."""
        import hashlib
        import base64
        
        sign_string = self.private_key + data + self.private_key
        return base64.b64encode(hashlib.sha1(sign_string.encode()).digest()).decode()


class PaymentProcessingService:
    """Enhanced payment processing service."""
    
    def __init__(self):
        # Choose payment gateway based on settings
        gateway_type = getattr(settings, 'PAYMENT_GATEWAY', 'mock')
        if gateway_type == 'liqpay':
            self.gateway = LiqPayGateway()
        else:
            self.gateway = MockPaymentGateway()
    
    @classmethod
    def process_ride_payment(
        cls,
        ride,
        payment_method: PaymentMethod,
        amount: Decimal
    ) -> Dict[str, Any]:
        """Process payment for completed ride."""
        
        service = cls()
        
        # Create payment record
        from .models import Payment
        payment = Payment.objects.create(
            ride=ride,
            user=ride.user,
            amount=amount,
            payment_method=payment_method.type.upper(),
            provider='CASH' if payment_method.type == 'cash' else 'MOCK',
            status='pending',
            description=f"Payment for ride {ride.id}"
        )
        
        try:
            # Handle cash payments
            if payment_method.type == PaymentMethod.PaymentType.CASH:
                return service._process_cash_payment(payment)
            
            # Handle card payments
            elif payment_method.type == PaymentMethod.PaymentType.CARD:
                return service._process_card_payment(payment)
            
            else:
                raise ValueError(f"Unsupported payment method type: {payment_method.type}")
                
        except Exception as e:
            logger.error(f"Payment processing failed for payment {payment.id}: {e}")
            payment.status = Payment.Status.FAILED
            payment.error_message = str(e)
            payment.save()
            raise
    
    def _process_cash_payment(self, payment) -> Dict[str, Any]:
        """Process cash payment (immediate confirmation)."""
        
        # Cash payments are confirmed immediately
        payment.status = Payment.Status.SUCCESS
        payment.processed_at = timezone.now()
        payment.save()
        
        logger.info(f"Cash payment processed for payment {payment.id}")
        
        return {
            'payment_id': str(payment.id),
            'status': 'completed',
            'payment_method': 'cash',
            'requires_confirmation': False,
        }
    
    def _process_card_payment(self, payment) -> Dict[str, Any]:
        """Process card payment through gateway."""
        
        payment.status = Payment.Status.PROCESSING
        payment.save()
        
        try:
            # Create payment intent with gateway
            intent = self.gateway.create_payment_intent(
                amount=payment.amount,
                currency=payment.currency,
                metadata={
                    'payment_id': str(payment.id),
                    'ride_id': str(payment.ride.id),
                    'user_id': str(payment.ride.user.id),
                }
            )
            
            # Store gateway response
            payment.provider_data = intent
            payment.provider_transaction_id = intent.get('id')
            payment.save()
            
            logger.info(f"Payment intent created for payment {payment.id}")
            
            return {
                'payment_id': str(payment.id),
                'status': 'requires_confirmation',
                'payment_method': 'card',
                'requires_confirmation': True,
                'client_secret': intent.get('client_secret'),
                'checkout_url': intent.get('checkout_url'),
                'gateway_data': intent,
            }
            
        except Exception as e:
            logger.error(f"Card payment intent creation failed: {e}")
            payment.status = Payment.Status.FAILED
            payment.error_message = str(e)
            payment.save()
            raise
    
    @classmethod
    def confirm_card_payment(cls, payment) -> Dict[str, Any]:
        """Confirm card payment with gateway."""
        
        if payment.payment_method != 'CARD':
            raise ValueError("Payment is not a card payment")
        
        if payment.status != Payment.Status.PROCESSING:
            raise ValueError("Payment is not in processing state")
        
        service = cls()
        
        try:
            # Confirm with gateway
            result = service.gateway.confirm_payment(
                intent_id=payment.provider_transaction_id,
                payment_method='mock_card'  # In real implementation, use actual payment method token
            )
            
            # Update payment based on result
            if result.get('status') == 'succeeded':
                charge_id = result.get('charges', {}).get('data', [{}])[0].get('id')
                payment.status = Payment.Status.SUCCESS
                payment.processed_at = timezone.now()
                payment.provider_transaction_id = charge_id
                payment.save()
                
                logger.info(f"Card payment confirmed for payment {payment.id}")
                
                return {
                    'payment_id': str(payment.id),
                    'status': 'completed',
                    'external_id': charge_id,
                }
            else:
                error = result.get('last_payment_error', {})
                payment.status = Payment.Status.FAILED
                payment.error_message = error.get('message', 'Payment failed')
                payment.save()
                
                return {
                    'payment_id': str(payment.id),
                    'status': 'failed',
                    'error_code': error.get('code'),
                    'error_message': error.get('message'),
                }
                
        except Exception as e:
            logger.error(f"Card payment confirmation failed: {e}")
            payment.status = Payment.Status.FAILED
            payment.error_message = str(e)
            payment.save()
            raise
    
    @classmethod
    def refund_payment(cls, payment, amount: Decimal = None) -> Dict[str, Any]:
        """Refund payment transaction."""
        
        if payment.status != Payment.Status.SUCCESS:
            raise ValueError("Can only refund successful payments")
        
        refund_amount = amount or payment.amount
        
        if refund_amount > payment.amount:
            raise ValueError("Refund amount cannot exceed original amount")
        
        service = cls()
        
        # Create refund record
        from .models import Refund
        refund = Refund.objects.create(
            payment=payment,
            amount=refund_amount,
            reason='Customer refund',
            status=Refund.Status.PENDING
        )
        
        try:
            # Handle cash refunds
            if payment.payment_method == 'CASH':
                # Cash refunds are marked as completed (manual process)
                refund.status = Refund.Status.SUCCESS
                refund.processed_at = timezone.now()
                refund.save()
                
                return {
                    'refund_id': str(refund.id),
                    'status': 'completed',
                    'amount': float(refund_amount),
                }
            
            # Handle card refunds through gateway
            else:
                result = service.gateway.refund_payment(
                    payment_id=payment.provider_transaction_id,
                    amount=refund_amount
                )
                
                if result.get('status') == 'succeeded':
                    refund.status = Refund.Status.SUCCESS
                    refund.processed_at = timezone.now()
                    refund.provider_refund_id = result.get('id')
                    refund.save()
                    
                    return {
                        'refund_id': str(refund.id),
                        'status': 'completed',
                        'amount': float(refund_amount),
                        'external_id': result.get('id'),
                    }
                else:
                    refund.status = Refund.Status.FAILED
                    refund.save()
                    raise ValueError("Refund failed")
                    
        except Exception as e:
            logger.error(f"Refund failed for payment {payment.id}: {e}")
            refund.status = Refund.Status.FAILED
            refund.save()
            raise


class PaymentWebhookService:
    """Service for handling payment gateway webhooks."""
    
    @classmethod
    def handle_liqpay_callback(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle LiqPay payment callback."""
        
        try:
            order_id = data.get('order_id')
            status = data.get('status')
            
            # Find payment by external transaction ID
            from .models import Payment
            payment = Payment.objects.filter(
                provider_transaction_id=order_id
            ).first()
            
            if not payment:
                logger.warning(f"Payment not found for order_id: {order_id}")
                return {'status': 'error', 'message': 'Payment not found'}
            
            # Update payment status based on callback
            if status == 'success':
                payment.status = Payment.Status.SUCCESS
                payment.processed_at = timezone.now()
                payment.save()
                
                # Notify user about successful payment
                # TODO: Implement notification service
                
            elif status in ['failure', 'error']:
                payment.status = Payment.Status.FAILED
                payment.error_message = data.get('err_description', 'Payment failed')
                payment.save()
            
            return {'status': 'success'}
            
        except Exception as e:
            logger.error(f"LiqPay callback processing failed: {e}")
            return {'status': 'error', 'message': str(e)}
