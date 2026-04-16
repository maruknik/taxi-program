"""
Views for users app.
"""

import logging
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from svix.webhooks import Webhook, WebhookVerificationError
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.users.models import User
from apps.users.serializers import (
    UserSerializer, UserDetailSerializer,
    UserUpdateSerializer, FCMTokenSerializer, UserListSerializer,
    UserProfileSerializer, 
    UpdateProfileSerializer, 
    UserStatsSerializer,
    ChangePasswordSerializer,
    SecurityStatusSerializer,
    PasswordStrengthSerializer
)
from apps.users.services.security import PasswordService, SecurityAuditService
from apps.users.services.account_deletion import AccountDeletionService
from apps.users.services import (
    handle_clerk_user_created,
    handle_clerk_user_deleted,
    handle_clerk_user_updated,
)
from core.permissions import IsAdminUser, IsOwnerOrAdmin

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model."""

    queryset = User.objects.all()
    permission_classes = []

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action in ['update', 'partial_update', 'update_profile']:
            return UserUpdateSerializer
        elif self.action in ['retrieve', 'me']:
            return UserDetailSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsAdminUser()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """GET /api/users/me/ — Current user profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        """GET /api/v1/users/profile/ — Get current user profile."""
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """PATCH /api/v1/users/update_profile/ — Update current user profile."""
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        # Handle data parsing for different request types
        if hasattr(request, 'data'):
            data = request.data
        elif hasattr(request, 'body') and request.body:
            import json
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = {}
        
        serializer = UpdateProfileSerializer(
            user, 
            data=data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """GET /api/v1/users/stats/ — Get user statistics."""
        from datetime import datetime, timedelta
        from django.db.models import Count, Sum, Avg
        from apps.rides.models import Ride
        
        user = request.user
        
        # Basic stats
        total_rides = user.total_rides
        total_spent = user.total_spent
        average_rating = float(user.average_rating)
        profile_completion = user.profile_completion
        
        # Monthly stats
        one_month_ago = datetime.now() - timedelta(days=30)
        monthly_rides = Ride.objects.filter(
            user=user,
            status='completed',
            created_at__gte=one_month_ago
        ).count()
        
        monthly_spent = Ride.objects.filter(
            user=user,
            status='completed',
            created_at__gte=one_month_ago
        ).aggregate(total=Sum('final_price'))['total'] or 0
        
        # Favorite destinations (most frequent)
        favorite_pickup = Ride.objects.filter(
            user=user,
            status='completed'
        ).values('pickup_address').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        favorite_dropoff = Ride.objects.filter(
            user=user,
            status='completed'
        ).values('dropoff_address').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        data = {
            'total_rides': total_rides,
            'total_spent': total_spent,
            'average_rating': average_rating,
            'profile_completion': profile_completion,
            'rides_this_month': monthly_rides,
            'spent_this_month': monthly_spent,
            'favorite_pickup_address': favorite_pickup['pickup_address'] if favorite_pickup else None,
            'favorite_dropoff_address': favorite_dropoff['dropoff_address'] if favorite_dropoff else None,
        }
        
        serializer = UserStatsSerializer(data)
        return Response(serializer.data)

    
    @action(detail=False, methods=['post'])
    def fcm_token(self, request):
        """POST /api/users/fcm_token/ — Update FCM token."""
        serializer = FCMTokenSerializer(data=request.data)
        if serializer.is_valid():
            request.user.fcm_token = serializer.validated_data['fcm_token']
            request.user.save(update_fields=['fcm_token'])
            logger.info(f"User {request.user.email} updated FCM token")
            return Response({'message': 'FCM token updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def ride_history(self, request):
        """GET /api/users/ride_history/ — Ride history (Plan 04)."""
        return Response({'message': 'Ride history endpoint', 'rides': [], 'count': 0})

    @action(detail=False, methods=['patch'])
    def language(self, request):
        """PATCH /api/v1/users/profile/language/ — Update user language preference."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        language = request.data.get('language')
        
        if not language:
            return Response(
                {'error': 'Language is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate language
        valid_languages = ['uk', 'en', 'pl', 'de', 'fr']
        if language not in valid_languages:
            return Response(
                {'error': 'Invalid language'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user language
        user.language = language
        user.save()
        
        return Response({
            'language': language,
            'message': 'Language updated successfully'
        })

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """POST /api/v1/users/profile/change-password/ — Change user password."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            current_password = serializer.validated_data['current_password']
            new_password = serializer.validated_data['new_password']
            
            result = PasswordService.change_password(
                user=user,
                current_password=current_password,
                new_password=new_password
            )
            
            if result['success']:
                return Response({
                    'message': result['message']
                })
            else:
                return Response(
                    {'error': result['error']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def security_status(self, request):
        """GET /api/v1/users/profile/security-status/ — Get user security status."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        security_status = SecurityAuditService.get_security_status(user)
        serializer = SecurityStatusSerializer(security_status)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def check_password_strength(self, request):
        """POST /api/v1/users/profile/check-password-strength/ — Check password strength."""
        
        serializer = PasswordStrengthSerializer(data=request.data)
        
        if serializer.is_valid():
            return Response(serializer.validated_data['password'])
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def delete_account(self, request):
        """POST /api/v1/users/profile/delete-account/ — Delete user account."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        password = request.data.get('password')
        reason = request.data.get('reason', '')
        
        if not password:
            return Response(
                {'error': 'Підтвердіть видалення паролем'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'error': 'Невірний пароль'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for active rides
        from apps.rides.models import Ride
        active_rides = Ride.objects.filter(
            user=user,
            status__in=['pending', 'accepted', 'in_progress']
        ).exists()
        
        if active_rides:
            return Response(
                {'error': 'Неможливо видалити акаунт з активними поїздками'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initiate deletion
        result = AccountDeletionService.initiate_account_deletion(
            user=user,
            reason=reason
        )
        
        if result['success']:
            return Response(result)
        else:
            return Response(
                {'error': result['error']}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def cancel_deletion(self, request):
        """POST /api/v1/users/profile/cancel-deletion/ — Cancel account deletion."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        result = AccountDeletionService.cancel_account_deletion(user)
        
        if result['success']:
            return Response(result)
        else:
            return Response(
                {'error': result['error']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def deletion_status(self, request):
        """GET /api/v1/users/profile/deletion-status/ — Get account deletion status."""
        
        # For testing, get first user if no authentication
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if request has user attribute
        if hasattr(request, 'user') and hasattr(request.user, 'is_anonymous'):
            if request.user.is_anonymous:
                user = User.objects.first()
            else:
                user = request.user
        else:
            # No authentication, get first user for testing
            user = User.objects.first()
        
        from apps.users.models import DeletionRequest
        deletion_request = DeletionRequest.objects.filter(
            user=user,
            status='pending'
        ).first()
        
        if deletion_request:
            return Response({
                'has_pending_deletion': True,
                'scheduled_date': deletion_request.scheduled_deletion_date,
                'days_remaining': (deletion_request.scheduled_deletion_date - timezone.now()).days,
                'reason': deletion_request.reason,
            })
        else:
            return Response({
                'has_pending_deletion': False
            })


@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def clerk_webhook(request):
    """Webhook endpoint for Clerk events."""
    try:
        headers = {
            'svix-id': request.headers.get('svix-id', ''),
            'svix-timestamp': request.headers.get('svix-timestamp', ''),
            'svix-signature': request.headers.get('svix-signature', ''),
        }

        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        payload = wh.verify(request.body, headers)

        event_type = payload.get('type')
        data = payload.get('data')

        logger.info("Received Clerk webhook: %s", event_type)

        if event_type == 'user.created':
            handle_clerk_user_created(data)
        elif event_type == 'user.updated':
            handle_clerk_user_updated(data)
        elif event_type == 'user.deleted':
            handle_clerk_user_deleted(data)
        else:
            logger.warning("Unknown event type: %s", event_type)

        return JsonResponse({'status': 'success'}, status=200)

    except WebhookVerificationError:
        logger.warning("Invalid webhook signature")
        return JsonResponse({'error': 'Invalid signature'}, status=401)
    except Exception as e:
        logger.error("Webhook error: %s", e, exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)

    
