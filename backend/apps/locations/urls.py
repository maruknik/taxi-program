"""
Location app URLs.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavedAddressViewSet, LocationViewSet

router = DefaultRouter()
router.register(r'saved-addresses', SavedAddressViewSet, basename='saved-addresses')
router.register(r'', LocationViewSet, basename='locations')

urlpatterns = [
    path('', include(router.urls)),
]
