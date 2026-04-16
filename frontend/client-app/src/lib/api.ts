import axios from "axios";

// Backend API URL з environment variables
const baseURL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.181:8000/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 секунд
});

export const paymentApi = {
  getPaymentMethods: () => apiClient.get('/payments/payment-methods/'),
  addCard: (cardData: any) => apiClient.post('/payments/payment-methods/add_card/', cardData),
  setDefault: (id: string) => apiClient.post(`/payments/payment-methods/${id}/set_default/`),
  remove: (id: string) => apiClient.delete(`/payments/payment-methods/${id}/remove/`),

  // Process ride payment
  processRidePayment: (data: {
    ride_id: string;
    payment_method_id: string;
    amount: number;
  }) => apiClient.post('/payments/payment-methods/process_ride_payment/', data),

  // Confirm payment
  confirmPayment: (paymentId: string) => 
    apiClient.post(`/payments/payment-methods/${paymentId}/confirm_payment/`),

  // Get transaction
  getTransaction: (paymentId: string) => 
    apiClient.get(`/payments/payment-methods/${paymentId}/`),

  // Refund payment (admin only)
  refundPayment: (paymentId: string, amount?: number) => 
    apiClient.post(`/payments/payment-methods/${paymentId}/refund_payment/`, { amount }),
};

// Ride history API
export const rideApi = {
  // Get ride history
  getHistory: () => apiClient.get('/rides/history/'),
  
  // Get ride details
  getDetails: (rideId: string) => apiClient.get(`/rides/${rideId}/detail/`),
  
  // Repeat ride
  repeatRide: (data: { ride_id: string; reverse_route?: boolean }) => 
    apiClient.post('/rides/repeat/', data),
};
