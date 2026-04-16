"""
Security and password management services.
"""

import secrets
import string
import logging
from typing import List, Dict, Any
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


class PasswordService:
    """Service for password management and validation."""
    
    @classmethod
    def validate_password_strength(cls, password: str) -> Dict[str, Any]:
        """Validate password strength and return detailed feedback."""
        
        errors = []
        warnings = []
        score = 0
        
        # Length check
        if len(password) < 8:
            errors.append("Пароль повинен містити принаймні 8 символів")
        elif len(password) >= 12:
            score += 2
        else:
            score += 1
        
        # Character variety checks
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if not has_lower:
            errors.append("Пароль повинен містити принаймні одну малу літеру")
        else:
            score += 1
            
        if not has_upper:
            warnings.append("Рекомендується додати велику літеру")
        else:
            score += 1
            
        if not has_digit:
            warnings.append("Рекомендується додати цифру")
        else:
            score += 1
            
        if not has_special:
            warnings.append("Рекомендується додати спеціальний символ")
        else:
            score += 2
        
        # Common password check
        common_passwords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', '111111', '123123', 'admin', 'letmein'
        ]
        
        if password.lower() in common_passwords:
            errors.append("Цей пароль занадто простий")
            score = 0
        
        # Sequential characters check
        if cls._has_sequential_chars(password):
            warnings.append("Уникайте послідовних символів")
        
        # Determine strength
        if score >= 7:
            strength = "strong"
        elif score >= 4:
            strength = "medium"
        else:
            strength = "weak"
        
        return {
            'valid': len(errors) == 0,
            'strength': strength,
            'score': score,
            'errors': errors,
            'warnings': warnings,
        }
    
    @classmethod
    def _has_sequential_chars(cls, password: str) -> bool:
        """Check for sequential characters like 123 or abc."""
        sequential_patterns = [
            '123', '234', '345', '456', '567', '678', '789',
            'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi',
            'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio'
        ]
        
        password_lower = password.lower()
        return any(pattern in password_lower for pattern in sequential_patterns)
    
    @classmethod
    def generate_secure_password(cls, length: int = 12) -> str:
        """Generate a secure random password."""
        
        # Ensure we have at least one character from each category
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*"
        
        # Start with one character from each category
        password = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits),
            secrets.choice(special),
        ]
        
        # Fill the rest with random characters
        all_chars = lowercase + uppercase + digits + special
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    @classmethod
    def change_password(cls, user: User, current_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password with validation."""
        
        # Check if account is locked
        if user.is_account_locked:
            return {
                'success': False,
                'error': f"Акаунт заблоковано до {user.account_locked_until.strftime('%H:%M')}"
            }
        
        # Verify current password
        if not user.check_password(current_password):
            return {
                'success': False,
                'error': "Невірний поточний пароль"
            }
        
        # Validate new password
        validation_result = cls.validate_password_strength(new_password)
        if not validation_result['valid']:
            return {
                'success': False,
                'error': validation_result['errors'][0],
                'validation': validation_result
            }
        
        # Check if new password is different from current
        if user.check_password(new_password):
            return {
                'success': False,
                'error': "Новий пароль повинен відрізнятися від поточного"
            }
        
        try:
            # Use Django's password validation
            validate_password(new_password, user)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            logger.info(f"Password changed for user {user.username}")
            
            return {
                'success': True,
                'message': "Пароль успішно змінено"
            }
            
        except ValidationError as e:
            return {
                'success': False,
                'error': '; '.join(e.messages)
            }


class SecurityAuditService:
    """Service for security auditing and monitoring."""
    
    @classmethod
    def get_security_status(cls, user: User) -> Dict[str, Any]:
        """Get comprehensive security status for user."""
        
        status = {
            'password_age_days': user.password_age_days,
            'should_change_password': user.should_change_password,
            'two_factor_enabled': user.two_factor_enabled,
            'failed_login_attempts': user.failed_login_attempts,
            'account_locked': user.is_account_locked,
            'email_verified': getattr(user, 'email_verified', False),
            'phone_verified': getattr(user, 'phone_verified', False),
        }
        
        # Calculate security score
        score = 0
        
        if user.password_age_days is None or user.password_age_days < 90:
            score += 20
        
        if user.two_factor_enabled:
            score += 30
        
        if getattr(user, 'email_verified', False):
            score += 20
        
        if getattr(user, 'phone_verified', False):
            score += 20
        
        if user.failed_login_attempts == 0:
            score += 10
        
        status['security_score'] = score
        
        # Generate recommendations
        recommendations = []
        
        if user.should_change_password:
            recommendations.append("Змініть пароль - він застарів")
        
        if not user.two_factor_enabled:
            recommendations.append("Увімкніть двофакторну автентифікацію")
        
        if not getattr(user, 'email_verified', False):
            recommendations.append("Підтвердіть email адресу")
        
        if not getattr(user, 'phone_verified', False):
            recommendations.append("Підтвердіть номер телефону")
        
        status['recommendations'] = recommendations
        
        return status
