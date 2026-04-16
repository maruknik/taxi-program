import { Timestamps } from './api.types';
import { LocationWithAddress } from './location.types';
import { User } from './user.types';
import { Driver } from './driver.types';

export type RideStatus = 
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RideType = 'economy' | 'comfort' | 'business';

export interface Ride extends Timestamps {
  id: string;
  user_id: string;
  driver_id?: string;
  
  // Locations
  pickup_location: LocationWithAddress;
  dropoff_location: LocationWithAddress;
  
  // Ride details
  ride_type: RideType;
  status: RideStatus;
  distance_km: number;
  duration_minutes: number;
  
  // Pricing
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  total_fare: number;
  
  // Times
  scheduled_time?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Relations
  user?: User;
  driver?: Driver;
  
  // Additional
  cancellation_reason?: string;
  rating?: number;
  review?: string;
}

export interface CreateRideDto {
  pickup_location: LocationWithAddress;
  dropoff_location: LocationWithAddress;
  ride_type: RideType;
  scheduled_time?: string;
  payment_method_id?: string;
}

export interface RidePriceEstimate {
  ride_type: RideType;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  total_fare: number;
  distance_km: number;
  duration_minutes: number;
}

export interface CancelRideDto {
  cancellation_reason: string;
}

export interface RateRideDto {
  rating: number;
  review?: string;
}

export interface RideTypeOption {
  id: RideType;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  pricePerKm: number;
  eta: number; // minutes
}

export interface PriceEstimate {
  vehicle_type: RideType;
  estimated_price: number;
  distance_km: number;
  duration_minutes: number;
  eta_minutes: number;
}

export interface PriceEstimateResponse {
  estimates: {
    economy: PriceEstimate;
    comfort: PriceEstimate;
    business: PriceEstimate;
  };
}
