"""
URL configuration for payments app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.payments.views import PaymentViewSet, PaymentMethodViewSet, fondy_callback, liqpay_callback
from apps.payments.receipt_views import ReceiptViewSet

router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-method')
router.register(r'receipts', ReceiptViewSet, basename='receipt')
router.register(r'transactions', PaymentViewSet, basename='payment')

urlpatterns = [
    path('callback/liqpay/', liqpay_callback, name='liqpay-callback'),
    path('callback/fondy/', fondy_callback, name='fondy-callback'),
    path('', include(router.urls)),
]
