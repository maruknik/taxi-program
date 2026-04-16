"""
URL configuration for notifications app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.notifications.views import NotificationViewSet, DeviceViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'devices', DeviceViewSet, basename='device')

urlpatterns = [path('', include(router.urls))]
