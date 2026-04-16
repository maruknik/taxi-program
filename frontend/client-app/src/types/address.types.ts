export type AddressType = 'home' | 'work' | 'favorite';

export interface SavedAddress {
  id: string;
  type: AddressType;
  address: string;
  latitude?: number;
  longitude?: number;
  entrance?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  custom_name?: string;
  display_name: string;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedAddressRequest {
  type: AddressType;
  address: string;
  latitude?: number;
  longitude?: number;
  entrance?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  custom_name?: string;
}

export interface AddressSearchResult {
  address: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  description?: string;
}

export interface RecentAddress {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  usage_count: number;
  last_used: string;
}

export interface GroupedAddresses {
  home: SavedAddress | null;
  work: SavedAddress | null;
  favorites: SavedAddress[];
}

export const ADDRESS_TYPE_OPTIONS = [
  { value: 'home', label: 'Дім', icon: 'home' },
  { value: 'work', label: 'Робота', icon: 'briefcase' },
  { value: 'favorite', label: 'Обране', icon: 'heart' },
] as const;
