from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read serializer."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name', 'last_name',
            'full_name', 'profile_image', 'date_of_birth', 'is_passenger', 'is_driver', 'is_verified', 'created_at',
        ]
        read_only_fields = ['id', 'email', 'is_passenger', 'is_driver', 'is_verified', 'created_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed read serializer with statistics."""
    full_name = serializers.CharField(read_only=True)
    rides_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone_number', 'first_name', 'last_name',
            'full_name', 'profile_image', 'date_of_birth', 'is_passenger', 'is_driver', 'is_verified', 'is_active',
            'created_at', 'updated_at', 'last_login',
            'rides_count', 'total_spent', 'average_rating',
        ]
        read_only_fields = [
            'id', 'email', 'is_passenger', 'is_driver', 'is_verified', 'is_active',
            'created_at', 'updated_at', 'last_login',
        ]

    def get_rides_count(self, obj) -> int:
        return 0  # Буде реалізовано в Plan 04

    def get_total_spent(self, obj) -> float:
        return 0.0  # Буде реалізовано в Plan 04

    def get_average_rating(self, obj) -> float:
        return 0.0  # Буде реалізовано в Plan 04


class UserUpdateSerializer(serializers.ModelSerializer):
    license_expiry = serializers.DateField(required=False, allow_null=True)
    profile_image = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'profile_image', 'date_of_birth', 'license_expiry']

    def validate_phone_number(self, value):
        if value:
            from core.validators import validate_phone_number
            validate_phone_number(value)
            # Check uniqueness excluding the current instance
            qs = User.objects.filter(phone_number=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('Цей номер телефону вже використовується.')
        return value

    def update(self, instance, validated_data):
        license_expiry = validated_data.pop('license_expiry', None)

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.profile_image = validated_data.get('profile_image', instance.profile_image)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.save()

        # Update driver profile if it exists
        if license_expiry is not None and hasattr(instance, 'driver_profile'):
            driver_profile = instance.driver_profile
            driver_profile.license_expiry = license_expiry
            driver_profile.save(update_fields=['license_expiry'])

        return instance


class FCMTokenSerializer(serializers.Serializer):
    """Serializer for FCM token."""
    
    token = serializers.CharField(max_length=255)

    def validate_token(self, value):
        """Validate FCM token format."""
        if not value or len(value) < 100:
            raise serializers.ValidationError("Invalid FCM token format")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""
    
    full_name = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    gender_display = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'profile_image', 'date_of_birth', 'city', 'language',
            'gender', 'gender_display', 'age',
            'email_verified', 'phone_verified',
            'created_at', 'total_rides', 'total_spent', 'average_rating',
            'profile_completion'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'total_rides', 'total_spent', 'average_rating', 'age', 'gender_display']

    def get_full_name(self, obj):
        """Get user's full name."""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.email


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    profile_image = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 
            'profile_image', 'date_of_birth', 'city', 'language', 'gender'
        ]

    def validate_profile_image(self, value):
        if value and not value.startswith('data:image/') and not value.startswith('http'):
            raise serializers.ValidationError(
                "profile_image must be a URL or a base64 data URI (data:image/...)"
            )
        return value

    def validate_phone_number(self, value):
        """Validate phone number format."""
        if value and not value.startswith('+'):
            raise serializers.ValidationError(
                "Phone number must start with country code (e.g., +380)"
            )
        return value
    
    def validate_gender(self, value):
        """Validate gender choice."""
        valid_choices = [choice[0] for choice in User.GENDER_CHOICES]
        if value and value not in valid_choices:
            raise serializers.ValidationError(
                f"Invalid gender choice. Valid choices: {valid_choices}"
            )
        return value


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics."""
    
    total_rides = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_rating = serializers.FloatField()
    profile_completion = serializers.IntegerField()
    
    # Monthly stats
    rides_this_month = serializers.IntegerField()
    spent_this_month = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Favorite destinations
    favorite_pickup_address = serializers.CharField(allow_null=True)
    favorite_dropoff_address = serializers.CharField(allow_null=True)


class UserListSerializer(serializers.ModelSerializer):
    """Minimal serializer for admin list view."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'is_passenger', 'is_driver', 'is_active', 'is_verified', 'created_at']
        read_only_fields = ['id', 'email', 'full_name', 'is_passenger', 'is_driver', 'is_active', 'is_verified', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()
    
    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        
        if user.is_account_locked:
            raise serializers.ValidationError(
                f"Акаунт заблоковано до {user.account_locked_until.strftime('%H:%M')}"
            )
        
        if not user.check_password(value):
            raise serializers.ValidationError("Невірний поточний пароль")
        
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        from apps.users.services.security import PasswordService
        
        validation_result = PasswordService.validate_password_strength(value)
        
        if not validation_result['valid']:
            raise serializers.ValidationError(validation_result['errors'][0])
        
        return value
    
    def validate(self, data):
        """Validate password confirmation and uniqueness."""
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Паролі не збігаються'
            })
        
        # Check if new password is different from current
        user = self.context['request'].user
        if user.check_password(new_password):
            raise serializers.ValidationError({
                'new_password': 'Новий пароль повинен відрізнятися від поточного'
            })
        
        return data


class SecurityStatusSerializer(serializers.Serializer):
    """Serializer for security status."""
    
    password_age_days = serializers.IntegerField(allow_null=True)
    should_change_password = serializers.BooleanField()
    two_factor_enabled = serializers.BooleanField()
    failed_login_attempts = serializers.IntegerField()
    account_locked = serializers.BooleanField()
    email_verified = serializers.BooleanField()
    phone_verified = serializers.BooleanField()
    security_score = serializers.IntegerField()
    recommendations = serializers.ListField(child=serializers.CharField())


class PasswordStrengthSerializer(serializers.Serializer):
    """Serializer for password strength validation."""
    
    password = serializers.CharField()
    
    def validate_password(self, value):
        """Return password strength analysis."""
        from apps.users.services.security import PasswordService
        
        return PasswordService.validate_password_strength(value)