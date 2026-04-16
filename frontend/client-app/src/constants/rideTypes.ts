import { RideTypeOption } from '@/src/types/ride.types';

export const RIDE_TYPES: RideTypeOption[] = [
  {
    id: 'economy',
    name: 'Економ',
    description: 'Через 7 хвилин',
    icon: '🚗',
    basePrice: 50,
    pricePerKm: 8,
    eta: 7,
  },
  {
    id: 'comfort',
    name: 'Стандарт',
    description: 'Через 10 хвилин',
    icon: '🚙',
    basePrice: 70,
    pricePerKm: 12,
    eta: 10,
  },
  {
    id: 'business',
    name: 'Бізнес',
    description: 'Через 12 хвилин',
    icon: '🚐',
    basePrice: 100,
    pricePerKm: 18,
    eta: 12,
  },
];

export const getRideTypeById = (id: string): RideTypeOption | undefined => {
  return RIDE_TYPES.find(type => type.id === id);
};
