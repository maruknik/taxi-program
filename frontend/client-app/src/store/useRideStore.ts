import { create } from "zustand";
import { LocationWithAddress, RideType } from "@/src/types";
import { PriceEstimate } from "@/src/types/ride.types";

interface RideState {
  // Locations
  pickupLocation: LocationWithAddress | null;
  waypointLocations: (LocationWithAddress | null)[];
  dropoffLocation: LocationWithAddress | null;

  // Ride details
  rideType: RideType;
  selectedRideType: RideType | null;
  priceEstimates: PriceEstimate[] | null;
  scheduledTime: Date | null;
  
  // Current ride
  currentRideId: string | null;
  rideStatus: 'idle' | 'estimating' | 'confirming' | 'pending' | 'searching' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  
  // Real-time data
  driverLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updated_at?: string;
  } | null;
  
  eta: number | null;
  isETACalculating: boolean;
  
  // WebSocket
  wsConnectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  wsError: string | null;
  
  // Live ride data
  currentRideData: {
    id: string;
    status: string;
    driver?: {
      id: string;
      name: string;
      phone: string;
      vehicle: {
        make: string;
        model: string;
        color: string;
        plate: string;
      };
      location?: {
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
      };
    };
  } | null;

  // UI state
  isRouteModalVisible: boolean;
  isRideTypeSelectorVisible: boolean;
  isSelectingOnMap: boolean;
  selectingFor: "pickup" | "dropoff" | null;

  // Actions - Locations
  setPickupLocation: (location: LocationWithAddress | null) => void;
  setWaypointLocations: (locations: (LocationWithAddress | null)[]) => void;
  addWaypointLocation: (location: LocationWithAddress | null) => void;
  updateWaypointLocation: (
    index: number,
    location: LocationWithAddress | null,
  ) => void;
  removeWaypointLocation: (index: number) => void;
  clearWaypointLocations: () => void;
  setDropoffLocation: (location: LocationWithAddress | null) => void;
  swapLocations: () => void;

  // Actions - Ride details
  setRideType: (type: RideType) => void;
  setSelectedRideType: (type: RideType | null) => void;
  setPriceEstimates: (estimates: PriceEstimate[] | null) => void;
  setScheduledTime: (time: Date | null) => void;
  
  // Actions - Current ride
  setCurrentRideId: (id: string | null) => void;
  setRideStatus: (status: RideState['rideStatus']) => void;
  setDriverLocation: (location: RideState['driverLocation']) => void;
  setETA: (eta: number | null) => void;
  setETACalculating: (calculating: boolean) => void;
  setWSConnectionState: (state: RideState['wsConnectionState']) => void;
  setWSError: (error: string | null) => void;
  updateRideData: (data: Partial<RideState['currentRideData']>) => void;

  // Actions - UI
  setRouteModalVisible: (visible: boolean) => void;
  setRideTypeSelectorVisible: (visible: boolean) => void;
  setSelectingOnMap: (
    selecting: boolean,
    selectingFor?: "pickup" | "dropoff" | null,
  ) => void;

  // Actions - Reset
  resetRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  // Initial state
  pickupLocation: null,
  waypointLocations: [],
  dropoffLocation: null,
  rideType: "economy",
  selectedRideType: null,
  priceEstimates: null,
  scheduledTime: null,
  currentRideId: null,
  rideStatus: 'idle',
  driverLocation: null,
  eta: null,
  isETACalculating: false,
  wsConnectionState: 'disconnected',
  wsError: null,
  currentRideData: null,
  isRouteModalVisible: false,
  isRideTypeSelectorVisible: false,
  isSelectingOnMap: false,
  selectingFor: null,

  // Location actions
  setPickupLocation: (location) => set({ pickupLocation: location }),

  setWaypointLocations: (locations) => set({ waypointLocations: locations }),

  addWaypointLocation: (location) =>
    set((state) => ({
      waypointLocations: [...state.waypointLocations, location],
    })),

  updateWaypointLocation: (index, location) =>
    set((state) => {
      const next = [...state.waypointLocations];
      while (next.length <= index) {
        next.push(null);
      }
      next[index] = location;
      return { waypointLocations: next };
    }),

  removeWaypointLocation: (index) =>
    set((state) => ({
      waypointLocations: state.waypointLocations.filter((_, i) => i !== index),
    })),

  clearWaypointLocations: () => set({ waypointLocations: [] }),

  setDropoffLocation: (location) => set({ dropoffLocation: location }),

  swapLocations: () =>
    set((state) => ({
      pickupLocation: state.dropoffLocation,
      dropoffLocation: state.pickupLocation,
    })),

  // Ride details actions
  setRideType: (type) => set({ rideType: type }),
  setSelectedRideType: (type) => set({ selectedRideType: type }),
  setPriceEstimates: (estimates) => set({ priceEstimates: estimates }),
  setScheduledTime: (time) => set({ scheduledTime: time }),

  // Current ride actions
  setCurrentRideId: (id) => set({ currentRideId: id }),
  setRideStatus: (status) => set({ rideStatus: status }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setETA: (eta) => set({ eta }),
  setETACalculating: (calculating) => set({ isETACalculating: calculating }),
  setWSConnectionState: (state) => set({ wsConnectionState: state }),
  setWSError: (error) => set({ wsError: error }),
  updateRideData: (data) => set((state) => ({
    currentRideData: state.currentRideData ? { ...state.currentRideData, ...data } : null
  })),

  // UI actions
  setRouteModalVisible: (visible) => set({ isRouteModalVisible: visible }),
  setRideTypeSelectorVisible: (visible) => set({ isRideTypeSelectorVisible: visible }),

  setSelectingOnMap: (selecting, selectingFor = null) =>
    set({
      isSelectingOnMap: selecting,
      selectingFor: selecting ? selectingFor : null,
    }),

  // Reset
  resetRide: () =>
    set({
      pickupLocation: null,
      waypointLocations: [],
      dropoffLocation: null,
      rideType: "economy",
      selectedRideType: null,
      priceEstimates: null,
      scheduledTime: null,
      currentRideId: null,
      rideStatus: 'idle',
      driverLocation: null,
      eta: null,
      isETACalculating: false,
      wsConnectionState: 'disconnected',
      wsError: null,
      currentRideData: null,
      isRouteModalVisible: false,
      isRideTypeSelectorVisible: false,
      isSelectingOnMap: false,
      selectingFor: null,
    }),
}));
