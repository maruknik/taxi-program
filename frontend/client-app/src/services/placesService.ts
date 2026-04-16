const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const DIRECTIONS_API_BASE =
  "https://maps.googleapis.com/maps/api/directions/json";

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface DrivingRouteData {
  coordinates: RouteCoordinate[];
  durationText: string;
  startAddress: string;
  endAddress: string;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  distance_meters?: number;
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

/**
 * Пошук адрес за запитом
 */
export async function searchPlaces(
  query: string,
  location?: { latitude: number; longitude: number },
): Promise<PlacePrediction[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY!,
      language: "uk",
      components: "country:ua", // Тільки Україна
    });

    // Додати location bias якщо є поточна локація
    if (location) {
      params.append("location", `${location.latitude},${location.longitude}`);
      params.append("radius", "50000"); // 50 км
    }

    const response = await fetch(
      `${PLACES_API_BASE}/autocomplete/json?${params}`,
    );

    const data = await response.json();

    if (data.status === "OK") {
      return data.predictions.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: {
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text || "",
        },
        distance_meters: prediction.distance_meters,
      }));
    }

    if (data.status === "ZERO_RESULTS") {
      return [];
    }

    throw new Error(`Places API error: ${data.status}`);
  } catch (error) {
    console.error("Search places error:", error);
    return [];
  }
}

/**
 * Отримати деталі місця за place_id
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY!,
      language: "uk",
      fields: "place_id,formatted_address,geometry,name",
    });

    const response = await fetch(`${PLACES_API_BASE}/details/json?${params}`);

    const data = await response.json();

    if (data.status === "OK") {
      return {
        place_id: data.result.place_id,
        formatted_address: data.result.formatted_address,
        geometry: {
          location: {
            lat: data.result.geometry.location.lat,
            lng: data.result.geometry.location.lng,
          },
        },
        name: data.result.name,
      };
    }

    throw new Error(`Place Details API error: ${data.status}`);
  } catch (error) {
    console.error("Get place details error:", error);
    throw error;
  }
}

/**
 * Reverse geocoding: координати → адреса
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: GOOGLE_MAPS_API_KEY!,
      language: "uk",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    );

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    throw new Error(`Geocoding API error: ${data.status}`);
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

function decodePolyline(encoded: string): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    latitude += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    longitude += deltaLng;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

export async function getDrivingRouteData(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  waypoints?: RouteCoordinate[],
): Promise<DrivingRouteData> {
  try {
    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: "driving",
      language: "uk",
      key: GOOGLE_MAPS_API_KEY!,
    });

    const validWaypoints = waypoints?.filter(Boolean) || [];

    if (validWaypoints.length > 0) {
      params.append(
        "waypoints",
        validWaypoints
          .map((waypoint) => `${waypoint.latitude},${waypoint.longitude}`)
          .join("|"),
      );
    }

    const response = await fetch(`${DIRECTIONS_API_BASE}?${params}`);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes?.length) {
      throw new Error(`Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const encodedPoints = route?.overview_polyline?.points;
    const leg = route?.legs?.[0];

    if (!encodedPoints) {
      throw new Error("Directions API error: empty polyline");
    }

    const decodedCoordinates = decodePolyline(encodedPoints);

    if (!decodedCoordinates.length) {
      throw new Error("Directions API error: decoded route is empty");
    }

    return {
      coordinates: decodedCoordinates,
      durationText: leg?.duration?.text || "",
      startAddress: leg?.start_address || "",
      endAddress: leg?.end_address || "",
    };
  } catch (error) {
    console.error("Get driving route error:", error);
    return {
      coordinates: [origin, destination],
      durationText: "",
      startAddress: "",
      endAddress: "",
    };
  }
}

export async function getDrivingRouteCoordinates(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  waypoints?: RouteCoordinate[],
): Promise<RouteCoordinate[]> {
  const routeData = await getDrivingRouteData(origin, destination, waypoints);
  return routeData.coordinates;
}
