"""
User models.
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta


class UserManager(BaseUserManager):
    """Custom manager for User model."""

    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user.
        
        Args:
            email: User email
            password: User password (optional for Clerk users)
            **extra_fields: Additional fields
            
        Returns:
            Created User instance
        """
        if not email:
            raise ValueError('Email is required')

        email = self.normalize_email(email)
        
        # Default to passenger if no role specified
        extra_fields.setdefault('is_passenger', True)
        
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser.
        
        Args:
            email: User email
            password: User password
            **extra_fields: Additional fields
            
        Returns:
            Created superuser instance
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_passenger', True)
        extra_fields.setdefault('is_driver', False)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model.
    
    Користувач може бути одночасно пасажиром і водієм.
    is_passenger - доступ до client-app
    is_driver - доступ до driver-app  
    is_staff - доступ до admin панелі
    """

    # Primary key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Clerk integration
    clerk_user_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True, db_index=True,
        verbose_name='Clerk ID',
    )

    email = models.EmailField(
        unique=True, db_index=True,
        verbose_name='Email',
    )
    phone_number = models.CharField(
        max_length=20, unique=True, null=True, blank=True,
        verbose_name='Телефон',
    )
    first_name = models.CharField(
        max_length=100, blank=True,
        verbose_name="Ім'я",
    )
    last_name = models.CharField(
        max_length=100, blank=True,
        verbose_name='Прізвище',
    )
    profile_image = models.TextField(
        blank=True,
        verbose_name='Фото',
    )
    date_of_birth = models.DateField(
        null=True, blank=True,
        verbose_name='Дата народження',
    )
    city = models.CharField(
        max_length=100, blank=True,
        verbose_name='Місто',
    )
    language = models.CharField(
        max_length=5,
        choices=[
            ('uk', 'Українська'),
            ('en', 'English'),
            ('pl', 'Polski'),
            ('de', 'Deutsch'),
            ('fr', 'Français'),
        ],
        default='uk',
        verbose_name='Мова',
    )
    
    # Timezone preference
    timezone = models.CharField(
        max_length=50,
        default='Europe/Kiev',
        verbose_name='Часовий пояс',
    )
    
    # Security fields
    password_changed_at = models.DateTimeField(null=True, blank=True, verbose_name='Пароль змінено')
    failed_login_attempts = models.PositiveIntegerField(default=0, verbose_name='Невдалих спроб входу')
    account_locked_until = models.DateTimeField(null=True, blank=True, verbose_name='Акаунт заблоковано до')
    last_password_reset = models.DateTimeField(null=True, blank=True, verbose_name='Останній скид пароля')
    
    # Two-factor authentication
    two_factor_enabled = models.BooleanField(default=False, verbose_name='Двофакторна автентифікація')
    two_factor_secret = models.CharField(max_length=32, blank=True, verbose_name='Секрет 2FA')
    backup_codes = models.JSONField(default=list, blank=True, verbose_name='Резервні коди')

    # Additional personal information
    GENDER_CHOICES = [
        ('M', 'Чоловік'),
        ('F', 'Жінка'),
        ('O', 'Інше'),
        ('N', 'Не вказано'),
    ]
    
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        default='N',
        blank=True,
        verbose_name='Стать',
    )
    
    # Email verification
    email_verified = models.BooleanField(default=False, verbose_name='Email підтверджено')
    email_verification_token = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Токен верифікації email'
    )
    
    # Phone verification
    phone_verified = models.BooleanField(default=False, verbose_name='Телефон підтверджено')
    phone_verification_code = models.CharField(
        max_length=6, 
        blank=True, 
        null=True,
        verbose_name='Код верифікації телефону'
    )
    phone_verification_expires = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Термін дії коду верифікації'
    )

    # Ролі користувача (можуть бути обидві True)
    is_passenger = models.BooleanField(
        default=True,
        verbose_name='Пасажир',
        help_text='Має доступ до client-app'
    )
    is_driver = models.BooleanField(
        default=False,
        verbose_name='Водій',
        help_text='Має доступ до driver-app'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Адміністратор',
        help_text='Доступ до admin панелі'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Активний',
    )
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Підтверджений',
    )

    # Push notifications
    fcm_token = models.TextField(blank=True, verbose_name='FCM Token')

    # Statistics
    total_rides = models.PositiveIntegerField(default=0, verbose_name='Всього поїздок')
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Всього витрачено')
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name='Середній рейтинг')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')
    updated_at = models.DateTimeField(auto_now=True,       verbose_name='Оновлено')
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='Останній вхід')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['clerk_user_id']),
            models.Index(fields=['is_passenger']),
            models.Index(fields=['is_driver']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

    def __str__(self) -> str:
        """String representation."""
        return self.email

    @property
    def full_name(self) -> str:
        """
        Return full name.
        
        Returns:
            Full name or email if name not set
        """
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    def get_short_name(self) -> str:
        """
        Return short name.
        
        Returns:
            First name or email
        """
        return self.first_name if self.first_name else self.email

    @property
    def role_display(self) -> str:
        """Return display string for user roles."""
        roles = []
        if self.is_passenger:
            roles.append('Пасажир')
        if self.is_driver:
            roles.append('Водій')
        if self.is_staff:
            roles.append('Адмін')
        return ', '.join(roles) if roles else 'Користувач'

    def can_become_driver(self) -> bool:
        """Check if user can register as driver."""
        return not self.is_driver

    def can_become_passenger(self) -> bool:
        """Check if user can use client app."""
        return True

    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])

    @property
    def language_display(self) -> str:
        """Get display name for user's language."""
        language_map = {
            'uk': 'Українська',
            'en': 'English',
            'pl': 'Polski',
            'de': 'Deutsch',
            'fr': 'Français',
        }
        return language_map.get(self.language, 'Українська')

    @property
    def profile_completion(self) -> int:
        """Calculate profile completion percentage."""
        fields = [
            self.first_name,
            self.last_name,
            self.phone_number,
            self.profile_image,
            self.city,
        ]
        
        completed = sum(1 for field in fields if field)
        return int((completed / len(fields)) * 100)

    @property
    def age(self):
        """Calculate user's age from date of birth."""
        if not self.date_of_birth:
            return None
        
        from datetime import date
        today = date.today()
        age = today.year - self.date_of_birth.year
        
        # Adjust age if birthday hasn't occurred yet this year
        if today.month < self.date_of_birth.month or (
            today.month == self.date_of_birth.month and today.day < self.date_of_birth.day
        ):
            age -= 1
            
        return age

    def get_gender_display(self):
        """Get gender display text."""
        gender_dict = dict(self.GENDER_CHOICES)
        return gender_dict.get(self.gender, 'Не вказано')
    
    def set_password(self, raw_password):
        """Override set_password to track password changes."""
        super().set_password(raw_password)
        self.password_changed_at = timezone.now()
        self.failed_login_attempts = 0
        self.account_locked_until = None
    
    def check_password(self, raw_password):
        """Override check_password to handle failed attempts."""
        is_correct = super().check_password(raw_password)
        
        if not is_correct:
            self.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.account_locked_until = timezone.now() + timedelta(minutes=30)
            
            self.save(update_fields=['failed_login_attempts', 'account_locked_until'])
        else:
            # Reset failed attempts on successful login
            if self.failed_login_attempts > 0:
                self.failed_login_attempts = 0
                self.account_locked_until = None
                self.save(update_fields=['failed_login_attempts', 'account_locked_until'])
        
        return is_correct
    
    @property
    def is_account_locked(self):
        """Check if account is currently locked."""
        if not self.account_locked_until:
            return False
        return timezone.now() < self.account_locked_until
    
    @property
    def password_age_days(self):
        """Get password age in days."""
        if not self.password_changed_at:
            return None
        return (timezone.now() - self.password_changed_at).days
    
    @property
    def should_change_password(self):
        """Check if user should change password (older than 90 days)."""
        age = self.password_age_days
        return age is not None and age > 90


class DeletionRequest(models.Model):
    """Model for tracking account deletion requests."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Очікує'
        CANCELLED = 'cancelled', 'Скасовано'
        COMPLETED = 'completed', 'Завершено'
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_deletion_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Deletion request for {self.user.username} - {self.status}"