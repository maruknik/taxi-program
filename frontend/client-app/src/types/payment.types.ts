export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card';
  display_name: string;
  is_default: boolean;
  last_four_digits?: string;
  card_type?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface AddCardData {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  cardholder_name: string;
}

export interface PaymentMethodSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  onAddCard: () => void;
  selectedMethodId?: string;
}
