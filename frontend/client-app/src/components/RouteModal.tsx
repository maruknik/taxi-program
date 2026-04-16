import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/src/constants/theme";
import { useRideStore } from "@/src/store/useRideStore";
import { usePlacesAutocomplete } from "@/src/hooks/usePlacesAutocomplete";
import { getPlaceDetails, PlacePrediction } from "@/src/services/placesService";
import { POPULAR_PLACES } from "@/src/constants/popularPlaces";

interface RouteModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOnMap: (
    type: "pickup" | "waypoint" | "dropoff",
    waypointIndex?: number,
  ) => void;
}

type ActiveInput =
  | { type: "pickup" }
  | { type: "dropoff" }
  | { type: "waypoint"; index: number };

export function RouteModal({
  visible,
  onClose,
  onSelectOnMap,
}: RouteModalProps) {
  const {
    pickupLocation,
    waypointLocations,
    dropoffLocation,
    setPickupLocation,
    addWaypointLocation,
    updateWaypointLocation,
    removeWaypointLocation,
    setDropoffLocation,
  } = useRideStore();

  const [pickupQuery, setPickupQuery] = useState(pickupLocation?.address || "");
  const [waypointQueries, setWaypointQueries] = useState<string[]>(
    waypointLocations.map((location) => location?.address || ""),
  );
  const [dropoffQuery, setDropoffQuery] = useState(
    dropoffLocation?.address || "",
  );
  const [activeInput, setActiveInput] = useState<ActiveInput>({
    type: "dropoff",
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const activeQuery =
    activeInput.type === "pickup"
      ? pickupQuery
      : activeInput.type === "dropoff"
        ? dropoffQuery
        : waypointQueries[activeInput.index] || "";

  const { predictions, isLoading } = usePlacesAutocomplete(activeQuery);

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setIsLoadingDetails(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const placeDetails = await getPlaceDetails(prediction.place_id);

      const location = {
        latitude: placeDetails.geometry.location.lat,
        longitude: placeDetails.geometry.location.lng,
        address: prediction.description,
      };

      if (activeInput.type === "pickup") {
        setPickupLocation(location);
        setPickupQuery(prediction.description);
      } else if (activeInput.type === "waypoint") {
        updateWaypointLocation(activeInput.index, location);
        setWaypointQueries((prev) => {
          const next = [...prev];
          while (next.length <= activeInput.index) {
            next.push("");
          }
          next[activeInput.index] = prediction.description;
          return next;
        });
      } else if (activeInput.type === "dropoff") {
        setDropoffLocation(location);
        setDropoffQuery(prediction.description);
      }
    } catch (error) {
      console.error("Error selecting place:", error);
      Alert.alert("Помилка", "Не вдалося отримати деталі місця");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClearInput = (
    type: "pickup" | "waypoint" | "dropoff",
    index?: number,
  ) => {
    if (type === "pickup") {
      setPickupQuery("");
      setPickupLocation(null);
    } else if (type === "waypoint") {
      if (typeof index !== "number") {
        return;
      }

      setWaypointQueries((prev) => {
        const next = [...prev];
        while (next.length <= index) {
          next.push("");
        }
        next[index] = "";
        return next;
      });
      updateWaypointLocation(index, null);
    } else {
      setDropoffQuery("");
      setDropoffLocation(null);
    }
  };

  const handleAddStop = () => {
    const newIndex = waypointQueries.length;
    setWaypointQueries((prev) => [...prev, ""]);
    addWaypointLocation(null);
    setActiveInput({ type: "waypoint", index: newIndex });
  };

  const handleRemoveStop = (index: number) => {
    setWaypointQueries((prev) => prev.filter((_, i) => i !== index));
    removeWaypointLocation(index);

    if (activeInput.type === "waypoint") {
      if (activeInput.index === index) {
        setActiveInput({ type: "dropoff" });
      } else if (activeInput.index > index) {
        setActiveInput({ type: "waypoint", index: activeInput.index - 1 });
      }
    }
  };

  const handleSwapLocations = () => {
    const tempQuery = pickupQuery;
    setPickupQuery(dropoffQuery);
    setDropoffQuery(tempQuery);

    const tempLocation = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(tempLocation);
  };

  const renderPopularPlaces = () => {
    if (
      pickupQuery.length > 0 ||
      waypointQueries.some((query) => query.length > 0) ||
      dropoffQuery.length > 0
    ) {
      return null;
    }

    return (
      <View style={styles.popularPlaces}>
        <Text style={styles.sectionTitle}>Популярні місця</Text>
        {POPULAR_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.predictionItem}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const location = {
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                address: place.address,
              };

              if (activeInput.type === "pickup") {
                setPickupLocation(location);
                setPickupQuery(place.address);
              } else if (activeInput.type === "waypoint") {
                updateWaypointLocation(activeInput.index, location);
                setWaypointQueries((prev) => {
                  const next = [...prev];
                  while (next.length <= activeInput.index) {
                    next.push("");
                  }
                  next[activeInput.index] = place.address;
                  return next;
                });
              } else if (activeInput.type === "dropoff") {
                setDropoffLocation(location);
                setDropoffQuery(place.address);
              }
            }}
          >
            <View style={styles.predictionIcon}>
              <Ionicons
                name={place.icon as any}
                size={20}
                color={Colors.grayText}
              />
            </View>

            <View style={styles.predictionText}>
              <Text style={styles.predictionMain}>{place.name}</Text>
              <Text style={styles.predictionSecondary}>{place.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
            <Text style={styles.title}>Маршрут</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Input Fields */}
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={styles.inputsContainer}
          >
            {/* Pickup Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <View style={styles.pickupDot} />
              </View>

              <TextInput
                style={[
                  styles.input,
                  activeInput.type === "pickup" && styles.inputActive,
                ]}
                placeholder="Звідки?"
                value={pickupQuery}
                onChangeText={setPickupQuery}
                onFocus={() => setActiveInput({ type: "pickup" })}
                placeholderTextColor={Colors.grayText}
              />

              {pickupQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleClearInput("pickup")}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={Colors.grayText}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddStop}
              >
                <Ionicons name="add" size={20} color={Colors.black} />
              </TouchableOpacity>
            </View>

            {/* Waypoint Inputs */}
            {waypointQueries.map((waypointQuery, index) => (
              <View style={styles.inputWrapper} key={`waypoint-input-${index}`}>
                <View style={styles.iconContainer}>
                  <View style={styles.waypointDot} />
                </View>

                <TextInput
                  style={[
                    styles.input,
                    activeInput.type === "waypoint" &&
                      activeInput.index === index &&
                      styles.inputActive,
                  ]}
                  placeholder="Додати зупинку"
                  value={waypointQuery}
                  onChangeText={(text) => {
                    setWaypointQueries((prev) => {
                      const next = [...prev];
                      next[index] = text;
                      return next;
                    });
                  }}
                  onFocus={() => setActiveInput({ type: "waypoint", index })}
                  placeholderTextColor={Colors.grayText}
                />

                {waypointQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleClearInput("waypoint", index)}
                    style={styles.clearButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Colors.grayText}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleRemoveStop(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Dropoff Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <View style={styles.dropoffDot} />
              </View>

              <TextInput
                style={[
                  styles.input,
                  activeInput.type === "dropoff" && styles.inputActive,
                ]}
                placeholder="Місце призначення"
                value={dropoffQuery}
                onChangeText={setDropoffQuery}
                onFocus={() => setActiveInput({ type: "dropoff" })}
                placeholderTextColor={Colors.grayText}
              />

              {dropoffQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleClearInput("dropoff")}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={Colors.grayText}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSwapLocations}
                style={styles.swapButton}
              >
                <Ionicons name="swap-vertical" size={20} color={Colors.black} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Predictions or Popular Places */}
          {renderPopularPlaces()}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.predictionItem}
                  onPress={() => handleSelectPlace(item)}
                >
                  <View style={styles.predictionIcon}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={Colors.grayText}
                    />
                  </View>

                  <View style={styles.predictionText}>
                    <Text style={styles.predictionMain}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.predictionSecondary}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>

                  {item.distance_meters && (
                    <Text style={styles.predictionDistance}>
                      {(item.distance_meters / 1000).toFixed(1)} км
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.predictionsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : pickupQuery.length > 0 ||
            waypointQueries.some((query) => query.length > 0) ||
            dropoffQuery.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Адресу не знайдено</Text>
            </View>
          ) : null}

          {/* Select on Map Button */}
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              if (activeInput.type === "waypoint") {
                onSelectOnMap("waypoint", activeInput.index);
              } else {
                onSelectOnMap(activeInput.type);
              }
              onClose();
            }}
          >
            <Ionicons name="location" size={20} color={Colors.black} />
            <Text style={styles.mapButtonText}>Обрати на мапі</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {isLoadingDetails && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.black,
  },

  // Inputs
  inputsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  waypointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.grayText,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.black,
  },
  inputActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  clearButton: {
    position: "absolute",
    right: 48,
    width: 40,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  swapButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Predictions & Popular
  popularPlaces: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  predictionsList: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 14,
    color: Colors.grayText,
  },
  predictionDistance: {
    fontSize: 14,
    color: Colors.grayText,
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.grayText,
  },

  // Map Button
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
  },
  mapButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
