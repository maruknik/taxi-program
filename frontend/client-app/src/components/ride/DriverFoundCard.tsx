import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

export type RideCardStatus = 'accepted' | 'driver_arrived' | 'in_progress';

interface Driver {
  id: string;
  name: string;
  rating: number;
  total_rides?: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  photo_url?: string;
}

interface DriverFoundCardProps {
  driver: Driver;
  status: RideCardStatus;
  eta?: number;
  onCall?: () => void;
  onMessage?: () => void;
  onCancel?: () => void;
}

const WAIT_FREE_SECONDS = 180; // 3 хв безкоштовного очікування

export function DriverFoundCard({
  driver, status, eta, onCall, onMessage, onCancel,
}: DriverFoundCardProps) {
  const [waitSeconds, setWaitSeconds] = useState(WAIT_FREE_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'driver_arrived') {
      setWaitSeconds(WAIT_FREE_SECONDS);
      timerRef.current = setInterval(() => {
        setWaitSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const vehicleLabel = [driver.vehicle_color, driver.vehicle_make, driver.vehicle_model]
    .filter(Boolean).join(' ');

  const headerText =
    status === 'accepted'    ? `Прибуває через ${eta ?? '—'} хв` :
    status === 'driver_arrived' ? 'Водій прибув' :
                                  'У дорозі';

  return (
    <View style={styles.wrapper}>
      {/* Фіолетовий банер таймера — тільки при driver_arrived */}
      {status === 'driver_arrived' && (
        <View style={styles.timerBanner}>
          <Text style={styles.timerText}>
            Безплатний час очікування {formatTimer(waitSeconds)}
          </Text>
        </View>
      )}

      <View style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Заголовок */}
        <Text style={styles.headerText}>{headerText}</Text>
        <View style={styles.divider} />

        {/* Рядок водія */}
        <View style={styles.driverRow}>
          <View style={styles.avatarWrap}>
            {driver.photo_url ? (
              <Image source={{ uri: driver.photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={26} color={Colors.grayText} />
              </View>
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Ionicons name="star" size={13} color="#FFD700" style={{ marginLeft: 6 }} />
              <Text style={styles.ratingVal}>{driver.rating.toFixed(1)}</Text>
            </View>
            {driver.total_rides !== undefined && (
              <Text style={styles.rides}>{driver.total_rides} поїздок</Text>
            )}
            <Text style={styles.vehicleText}>
              {vehicleLabel}{driver.vehicle_plate ? ` • ${driver.vehicle_plate}` : ''}
            </Text>
          </View>

          <TouchableOpacity style={styles.optionsBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.black} />
          </TouchableOpacity>
        </View>

        {/* Дії: повідомлення + дзвінок */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.messageBtn} onPress={onMessage}>
            <Ionicons name="chatbubble-outline" size={17} color={Colors.grayText} style={{ marginRight: 8 }} />
            <Text style={styles.messagePlaceholder}>З побажання стосовно поїздки?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={onCall}>
            <Ionicons name="call" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Кнопки для driver_arrived */}
        {status === 'driver_arrived' && (
          <View style={styles.arrivedBtns}>
            {['Я на місці', 'Прямую до авто', 'Підійду до авто', 'На пізніше'].map(label => (
              <TouchableOpacity key={label} style={styles.arrivedBtn}>
                <Text style={styles.arrivedBtnText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Скасувати — тільки in_progress */}
        {status === 'in_progress' && (
          <TouchableOpacity style={styles.cancelRow} onPress={onCancel}>
            <Text style={styles.cancelText}>Скасувати</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },

  timerBanner: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timerText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 14,
  },

  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 14,
  },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatarWrap: { marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },

  infoCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  driverName: { fontSize: 16, fontWeight: '700', color: Colors.black },
  ratingVal: { fontSize: 14, fontWeight: '600', color: Colors.black, marginLeft: 3 },
  rides: { fontSize: 12, color: Colors.grayText, marginBottom: 3 },
  vehicleText: { fontSize: 13, color: Colors.grayText },

  optionsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },

  actionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  messagePlaceholder: { fontSize: 13, color: Colors.grayText, flex: 1 },
  callBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  arrivedBtns: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
  },
  arrivedBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: '#F5F5F5', borderRadius: 20,
  },
  arrivedBtnText: { fontSize: 13, color: Colors.black },

  cancelRow: {
    alignItems: 'center', paddingTop: 12,
  },
  cancelText: {
    fontSize: 15, color: '#E53935', fontWeight: '500',
  },
});