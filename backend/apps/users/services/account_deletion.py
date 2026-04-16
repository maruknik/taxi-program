"""
Account deletion and data cleanup services.
"""

import logging
from typing import Dict, Any
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


class AccountDeletionService:
    """Service for handling account deletion and data cleanup."""
    
    @classmethod
    def initiate_account_deletion(cls, user: User, reason: str = '') -> Dict[str, Any]:
        """Initiate account deletion process."""
        
        try:
            with transaction.atomic():
                # Mark user for deletion
                user.is_active = False
                user.username = f"deleted_{user.id}_{timezone.now().timestamp()}"
                user.email = f"deleted_{user.id}@deleted.local"
                user.save()
                
                # Schedule data cleanup (30 days grace period)
                deletion_date = timezone.now() + timedelta(days=30)
                
                # Create deletion record
                DeletionRequest.objects.create(
                    user=user,
                    reason=reason,
                    scheduled_deletion_date=deletion_date,
                    status='pending'
                )
                
                # Cleanup immediate sensitive data
                cls._cleanup_sensitive_data(user)
                
                logger.info(f"Account deletion initiated for user {user.id}")
                
                return {
                    'success': True,
                    'message': 'Акаунт деактивовано. Дані будуть видалені через 30 днів.',
                    'deletion_date': deletion_date.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Account deletion failed for user {user.id}: {e}")
            return {
                'success': False,
                'error': f'Не вдалося видалити акаунт: {str(e)}'
            }
    
    @classmethod
    def _cleanup_sensitive_data(cls, user: User) -> None:
        """Immediately cleanup sensitive user data."""
        
        # Clear personal information
        user.first_name = ''
        user.last_name = ''
        user.phone_number = None
        user.profile_image = None
        user.date_of_birth = None
        user.city = ''
        
        # Clear payment methods
        user.payment_methods.all().delete()
        
        # Clear saved addresses
        user.saved_addresses.all().delete()
        
        # Clear recent addresses
        user.recent_addresses.all().delete()
        
        # Clear FCM tokens
        user.fcm_tokens.all().delete()
        
        user.save()
    
    @classmethod
    def cancel_account_deletion(cls, user: User) -> Dict[str, Any]:
        """Cancel pending account deletion."""
        
        try:
            deletion_request = DeletionRequest.objects.filter(
                user=user,
                status='pending'
            ).first()
            
            if not deletion_request:
                return {
                    'success': False,
                    'error': 'Запит на видалення не знайдено'
                }
            
            # Reactivate account
            user.is_active = True
            user.save()
            
            # Cancel deletion request
            deletion_request.status = 'cancelled'
            deletion_request.save()
            
            logger.info(f"Account deletion cancelled for user {user.id}")
            
            return {
                'success': True,
                'message': 'Видалення акаунту скасовано'
            }
            
        except Exception as e:
            logger.error(f"Failed to cancel account deletion: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    def complete_account_deletion(cls, user: User) -> Dict[str, Any]:
        """Complete account deletion (called by scheduled task)."""
        
        try:
            with transaction.atomic():
                # Delete all related data
                user.rides.all().delete()
                user.transactions.all().delete()
                user.notifications.all().delete()
                user.saved_addresses.all().delete()
                user.recent_addresses.all().delete()
                user.payment_methods.all().delete()
                user.fcm_tokens.all().delete()
                
                # Delete user
                user_id = user.id
                user.delete()
                
                logger.info(f"Account completely deleted for user {user_id}")
                
                return {
                    'success': True,
                    'message': 'Акаунт повністю видалено'
                }
                
        except Exception as e:
            logger.error(f"Failed to complete account deletion: {e}")
            return {
                'success': False,
                'error': str(e)
            }


