import { Timestamps } from './api.types';
import { Location as Coordinates } from './location.types';

export type DriverStatus = 'offline' | 'available' | 'busy';

export interface Driver extends Timestamps {
  id: string;
  user_id: string;
  
  // Personal info
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar_url?: string;
  
  // Driver details
  license_number: string;
  license_expiry: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_plate: string;
  
  // Status
  status: DriverStatus;
  current_location?: Coordinates;
  
  // Stats
  rating: number;
  total_rides: number;
  acceptance_rate: number;
  
  // Verification
  is_verified: boolean;
  is_active: boolean;
}

export interface AvailableDriver {
  driver: Driver;
  distance_km: number;
  eta_minutes: number;
}

export interface DriverLocation extends Coordinates {
  driver_id: string;
  heading?: number;
  speed?: number;
  timestamp: string;
}
