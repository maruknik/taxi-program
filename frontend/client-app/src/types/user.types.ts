// src/types/user.types.ts
import { Timestamps } from './api.types';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  profile_image?: string;
  date_of_birth?: string;
  city?: string;
  language?: string;
  gender?: string;
  gender_display?: string;
  age?: number | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_active: boolean;
  is_driver: boolean;
  role: 'passenger' | 'driver' | 'admin';
  rating?: number;
  average_rating?: number;
  total_rides: number;
  total_spent?: number;
  profile_completion?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user: User;
  saved_addresses: SavedAddress[];
  payment_methods: any[]; // Буде уточнено в payment.types
  gender?: string;
  gender_display?: string;
  age?: number | null;
  email_verified?: boolean;
  phone_verified?: boolean;
}

export interface SavedAddress extends Timestamps {
  id: string;
  user_id: string;
  label: 'home' | 'work' | 'other';
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image?: string;
  date_of_birth?: string;
  city?: string;
  language?: string;
  gender?: string;
}

export interface UserStats {
  total_rides: number;
  total_spent: number;
  average_rating: number;
  profile_completion: number;
  rides_this_month: number;
  spent_this_month: number;
  favorite_pickup_address: string | null;
  favorite_dropoff_address: string | null;
}

export interface GenderOption {
  value: string;
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: 'M', label: 'Чоловік' },
  { value: 'F', label: 'Жінка' },
  { value: 'O', label: 'Інше' },
  { value: 'N', label: 'Не вказано' },
];

export interface PersonalInfo {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  age?: number;
  gender: 'M' | 'F' | 'O' | 'N';
  phone_number?: string;
  email: string;
  phone_verified: boolean;
  email_verified: boolean;
}

export interface UpdatePersonalInfoRequest {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'O' | 'N';
  phone_number?: string;
}

export interface ChangeEmailRequest {
  new_email: string;
  password: string;
}

export interface PhoneVerificationRequest {
  verification_code: string;
}

export const GENDER_OPTIONS_TYPED = [
  { value: 'N', label: 'Не вказано' },
  { value: 'M', label: 'Чоловік' },
  { value: 'F', label: 'Жінка' },
  { value: 'O', label: 'Інше' },
] as const;
