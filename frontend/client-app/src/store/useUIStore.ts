import { create } from "zustand";

interface UIState {
  // Modals
  isProfileModalVisible: boolean;
  isPaymentModalVisible: boolean;
  isPromoModalVisible: boolean;
  
  // Loading states
  isGlobalLoading: boolean;
  loadingMessage: string | null;
  
  // Toast/Snackbar
  toastMessage: string | null;
  toastType: "success" | "error" | "info" | "warning" | null;
  
  // Actions - Modals
  setProfileModalVisible: (visible: boolean) => void;
  setPaymentModalVisible: (visible: boolean) => void;
  setPromoModalVisible: (visible: boolean) => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
  
  // Actions - Toast
  showToast: (message: string, type?: UIState["toastType"] | null) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isProfileModalVisible: false,
  isPaymentModalVisible: false,
  isPromoModalVisible: false,
  isGlobalLoading: false,
  loadingMessage: null,
  toastMessage: null,
  toastType: null,

  // Modal actions
  setProfileModalVisible: (visible) =>
    set({ isProfileModalVisible: visible }),
  
  setPaymentModalVisible: (visible) =>
    set({ isPaymentModalVisible: visible }),
  
  setPromoModalVisible: (visible) =>
    set({ isPromoModalVisible: visible }),

  // Loading actions
  setGlobalLoading: (loading, message = null) =>
    set({ isGlobalLoading: loading, loadingMessage: message }),

  // Toast actions
  showToast: (message, type = "info") =>
    set({ toastMessage: message, toastType: type }),
  
  hideToast: () =>
    set({ toastMessage: null, toastType: null }),
}));
