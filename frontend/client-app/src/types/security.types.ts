export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordStrength {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  errors: string[];
  warnings: string[];
}

export interface SecurityStatus {
  password_age_days: number | null;
  should_change_password: boolean;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  account_locked: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  security_score: number;
  recommendations: string[];
}
