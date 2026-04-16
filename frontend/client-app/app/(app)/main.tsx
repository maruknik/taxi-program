import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "@/src/hooks/useLocation";
import { useRideStore } from "@/src/store/useRideStore";
import { useReverseGeocode } from "@/src/hooks/useReverseGeocode";
import { useSavedPlaces } from "@/src/hooks/useSavedPlaces";
import { Colors } from "@/src/constants/theme";
import { RouteModal } from '@/src/components/RouteModal';
import { RideTypeSelector } from '@/src/components/ride/RideTypeSelector';
import DrawerMenu from '@/src/components/DrawerMenu';
import { getDrivingRouteData } from "@/src/services/placesService";
import { LocationWithAddress } from "@/src/types";

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const hasAutoCenteredRef = useRef(false);
  const { location } = useLocation();
  const { home, work } = useSavedPlaces();
  const {
    pickupLocation,
    waypointLocations,
    dropoffLocation,
    isRouteModalVisible,
    isRideTypeSelectorVisible,
    setRouteModalVisible,
    setRideTypeSelectorVisible,
    selectedRideType,
    setSelectedRideType,
    setPickupLocation,
    updateWaypointLocation,
    setDropoffLocation,
  } = useRideStore();

  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [selectingFor, setSelectingFor] = useState<
    "pickup" | "waypoint" | "dropoff" | null
  >(null);
  const [selectingWaypointIndex, setSelectingWaypointIndex] = useState<
    number | null
  >(null);
  const [tempMarker, setTempMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeDurationText, setRouteDurationText] = useState("");
  const [routeStartAddress, setRouteStartAddress] = useState("");
  const [routeEndAddress, setRouteEndAddress] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // Reverse geocoding для тимчасового маркера
  const { data: tempAddress } = useReverseGeocode(
    tempMarker?.latitude || null,
    tempMarker?.longitude || null,
  );

  const initialRegion = {
    latitude: location?.latitude || 50.4501,
    longitude: location?.longitude || 30.5234,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Отримати маршрут по дорогах між pickup та dropoff
  useEffect(() => {
    let isActive = true;

    const fetchRouteByRoad = async () => {
      if (!pickupLocation || !dropoffLocation || isSelectingOnMap) {
        if (isActive) {
          setRouteCoordinates([]);
          setRouteDurationText("");
          setRouteStartAddress("");
          setRouteEndAddress("");
        }
        return;
      }

      const routeByRoad = await getDrivingRouteData(
        {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        },
        {
          latitude: dropoffLocation.latitude,
          longitude: dropoffLocation.longitude,
        },
        waypointLocations
          .filter((location): location is LocationWithAddress => !!location)
          .map((location) => ({
            latitude: location.latitude,
            longitude: location.longitude,
          })),
      );

      if (isActive) {
        setRouteCoordinates(routeByRoad.coordinates);
        setRouteDurationText(routeByRoad.durationText);
        setRouteStartAddress(routeByRoad.startAddress);
        setRouteEndAddress(routeByRoad.endAddress);
      }
    };

    fetchRouteByRoad();

    return () => {
      isActive = false;
    };
  }, [pickupLocation, waypointLocations, dropoffLocation, isSelectingOnMap]);

  // Центрувати карту коли обидві точки вибрані
  useEffect(() => {
    if (
      pickupLocation &&
      dropoffLocation &&
      mapRef.current &&
      !isSelectingOnMap
    ) {
      const coordinates =
        routeCoordinates.length > 1
          ? routeCoordinates
          : [
              {
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              },
              {
                latitude: dropoffLocation.latitude,
                longitude: dropoffLocation.longitude,
              },
            ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 300,
          left: 50,
        },
        animated: true,
      });
    }
  }, [pickupLocation, dropoffLocation, routeCoordinates, isSelectingOnMap]);

  // Автоцентрування на поточній локації після її завантаження
  useEffect(() => {
    if (
      !location ||
      !mapRef.current ||
      hasAutoCenteredRef.current ||
      isSelectingOnMap ||
      pickupLocation ||
      dropoffLocation
    ) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800,
    );

    hasAutoCenteredRef.current = true;
  }, [location, isSelectingOnMap, pickupLocation, dropoffLocation]);

  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  };

  const normalizeAddress = (address: string, fallback: string) => {
    if (!address.trim()) {
      return fallback;
    }

    const firstPart = address.split(",")[0]?.trim();
    return firstPart || fallback;
  };

  const topRouteLabel = normalizeAddress(
    routeEndAddress,
    dropoffLocation?.address || "Кінцева точка",
  );

  const bottomRouteLabel = normalizeAddress(
    routeStartAddress,
    pickupLocation?.address || "Початкова точка",
  );

  const handleMenuPress = () => {
    setIsDrawerVisible(true);
  };

  const handleRequestRide = () => {
    if (pickupLocation && dropoffLocation) {
      setRideTypeSelectorVisible(true);
    } else {
      Alert.alert('Помилка', 'Оберіть точки відправлення та призначення');
    }
  };

  const handleSelectRideType = (rideType: any) => {
    setSelectedRideType(rideType);
    setRideTypeSelectorVisible(false);
    
    // Перехід до екрану підтвердження
    router.push('/ride/confirmation');
  };

  const handleMapPress = (event: any) => {
    if (!isSelectingOnMap) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTempMarker({ latitude, longitude });
  };

  const handleConfirmSelection = () => {
    if (!tempMarker || !tempAddress) return;

    const locationData = {
      latitude: tempMarker.latitude,
      longitude: tempMarker.longitude,
      address: tempAddress,
    };

    if (selectingFor === "pickup") {
      setPickupLocation(locationData);
    } else if (selectingFor === "waypoint") {
      if (selectingWaypointIndex !== null) {
        updateWaypointLocation(selectingWaypointIndex, locationData);
      }
    } else if (selectingFor === "dropoff") {
      setDropoffLocation(locationData);
    }

    // Скинути стан вибору
    setIsSelectingOnMap(false);
    setSelectingFor(null);
    setSelectingWaypointIndex(null);
    setTempMarker(null);
    setRouteModalVisible(true);
  };

  const handleCancelSelection = () => {
    setIsSelectingOnMap(false);
    setSelectingFor(null);
    setSelectingWaypointIndex(null);
    setTempMarker(null);
    setRouteModalVisible(true);
  };

  const startMapSelection = (
    type: "pickup" | "waypoint" | "dropoff",
    waypointIndex?: number,
  ) => {
    setSelectingFor(type);
    setSelectingWaypointIndex(
      type === "waypoint" && typeof waypointIndex === "number"
        ? waypointIndex
        : null,
    );
    setIsSelectingOnMap(true);
    setRouteModalVisible(false);

    // Центрувати на поточній локації, якщо маркера ще немає
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  };

  const handleQuickPlace = (
    place: LocationWithAddress | null,
    type: string,
  ) => {
    if (place) {
      setPickupLocation(place);
      setRouteModalVisible(true);
    } else {
      router.push({
        pathname: '/(app)/profile/add-address',
        params: { type },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Карта */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={handleMapPress}
      >
        {/* Polyline між pickup та dropoff */}
        {pickupLocation && dropoffLocation && !isSelectingOnMap && (
          <Polyline
            coordinates={
              routeCoordinates.length > 1
                ? routeCoordinates
                : [
                    {
                      latitude: pickupLocation.latitude,
                      longitude: pickupLocation.longitude,
                    },
                    {
                      latitude: dropoffLocation.latitude,
                      longitude: dropoffLocation.longitude,
                    },
                  ]
            }
            strokeColor={Colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Маркер поточної локації */}
        {location && !isSelectingOnMap && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Waypoint маркери */}
        {!isSelectingOnMap &&
          waypointLocations.map((waypointLocation, index) =>
            waypointLocation ? (
              <Marker
                key={`waypoint-${index}`}
                coordinate={{
                  latitude: waypointLocation.latitude,
                  longitude: waypointLocation.longitude,
                }}
                title={`Проміжна точка ${index + 1}`}
                description={waypointLocation.address}
              >
                <View style={styles.waypointMarker}>
                  <Ionicons name="location" size={24} color={Colors.black} />
                </View>
              </Marker>
            ) : null,
          )}

        {/* Pickup маркер */}
        {pickupLocation && !isSelectingOnMap && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Відправлення"
            description={pickupLocation.address}
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={24} color={Colors.white} />
            </View>
          </Marker>
        )}

        {/* Dropoff маркер */}
        {dropoffLocation && !isSelectingOnMap && (
          <Marker
            coordinate={{
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            }}
            title="Призначення"
            description={dropoffLocation.address}
          >
            <View style={styles.dropoffMarker}>
              <Ionicons name="location" size={24} color={Colors.black} />
            </View>
          </Marker>
        )}

        {/* Тимчасовий маркер при виборі */}
        {tempMarker && isSelectingOnMap && (
          <Marker coordinate={tempMarker} anchor={{ x: 0.5, y: 1 }}>
            <View
              style={
                selectingFor === "pickup"
                  ? styles.pickupMarker
                  : selectingFor === "waypoint"
                    ? styles.waypointMarker
                    : styles.dropoffMarker
              }
            >
              <Ionicons
                name="location"
                size={24}
                color={selectingFor === "pickup" ? Colors.white : Colors.black}
              />
            </View>
          </Marker>
        )}
      </MapView>

      {/* UI для режиму вибору на карті */}
      {isSelectingOnMap ? (
        <>
          {/* Інструкція */}
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>
              {selectingFor === "pickup"
                ? "Виберіть місце відправлення"
                : selectingFor === "waypoint"
                  ? "Виберіть проміжну точку"
                  : "Виберіть місце призначення"}
            </Text>
            <Text style={styles.selectionSubtitle}>
              Натисніть на карту для вибору
            </Text>
          </View>

          {/* Адреса вибраної точки */}
          {tempMarker && tempAddress && (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.addressText} numberOfLines={2}>
                {tempAddress}
              </Text>
            </View>
          )}

          {/* Кнопки підтвердження/скасування */}
          <View style={styles.selectionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSelection}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !tempMarker && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmSelection}
              disabled={!tempMarker}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Підтвердити</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {pickupLocation && dropoffLocation && (
            <>
              <View style={styles.topRouteCard}>
                <Text style={styles.topRouteText} numberOfLines={1}>
                  {topRouteLabel}
                </Text>
              </View>

              <View style={styles.bottomRouteCard}>
                {!!routeDurationText && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{routeDurationText}</Text>
                  </View>
                )}
                <Text style={styles.bottomRouteText} numberOfLines={1}>
                  {bottomRouteLabel}
                </Text>
              </View>
            </>
          )}

          {/* Звичайний UI */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={30} color="#2F2B45" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationButton,
              { bottom: pickupLocation && dropoffLocation ? 300 : 240 },
            ]}
            onPress={centerOnUserLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={24} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setRouteModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={28} color="#2F2B45" />
              <Text style={styles.searchText}>Куди поїдемо?</Text>
              <View style={styles.scheduleButton}>
                <Ionicons name="time-outline" size={18} color="#2F2B45" />
                <Text style={styles.scheduleText}>Запланувати</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                activeOpacity={0.7}
                onPress={() => handleQuickPlace(home, 'home')}
              >
                <Ionicons name="home-outline" size={24} color="#2F2B45" />
                <Text style={styles.quickButtonText}>Дім</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                activeOpacity={0.7}
                onPress={() => handleQuickPlace(work, 'work')}
              >
                <Ionicons name="briefcase-outline" size={24} color="#2F2B45" />
                <Text style={styles.quickButtonText}>Робота</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Кнопка замовлення поїздки */}
      {pickupLocation && dropoffLocation && !isSelectingOnMap && (
        <TouchableOpacity
          style={styles.requestRideButton}
          onPress={handleRequestRide}
        >
          <Text style={styles.requestRideButtonText}>Замовити поїздку</Text>
        </TouchableOpacity>
      )}

      {/* Модальне вікно маршруту */}
      <RouteModal
        visible={isRouteModalVisible}
        onClose={() => setRouteModalVisible(false)}
        onSelectOnMap={startMapSelection}
      />

      <DrawerMenu
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />

      {/* Селектор типу поїздки */}
      <RideTypeSelector
        visible={isRideTypeSelectorVisible}
        onClose={() => setRideTypeSelectorVisible(false)}
        onSelectType={handleSelectRideType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    flex: 1,
  },

  // Маркери
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(107, 56, 251, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waypointMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.grayText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dropoffMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.black,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Режим вибору на карті
  selectionHeader: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: Colors.grayText,
  },

  addressCard: {
    position: "absolute",
    top: 160,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
  },

  selectionButtons: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Звичайний UI
  menuButton: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F3F3F5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  locationButton: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F3F3F5",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandle: {
    width: 32,
    height: 3,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
    opacity: 0.55,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6E6E9",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    color: "#7E7E86",
    fontWeight: "500",
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scheduleText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2F2B45",
    fontWeight: "500",
  },
  quickButtons: {
    flexDirection: "row",
    gap: 10,
  },
  quickButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#E6E6E9",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 10,
  },
  quickButtonText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#2F2B45",
  },
  topRouteCard: {
    position: "absolute",
    top: 62,
    left: 82,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  topRouteText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2F2B45",
  },
  bottomRouteCard: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 208,
    minHeight: 52,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 7,
  },
  durationBadge: {
    height: "100%",
    minWidth: 84,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  durationText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  bottomRouteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#2F2B45",
    paddingHorizontal: 14,
  },
  requestRideButton: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  requestRideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});