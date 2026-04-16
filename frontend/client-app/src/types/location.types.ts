// src/types/location.types.ts

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationWithAddress extends Location {
  address: string;
  placeId?: string;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
}
