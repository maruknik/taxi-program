import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface DriverMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  heading?: number;
  speed?: number;
  onPress?: () => void;
}

export function DriverMarker({ coordinate, heading = 0, speed = 0, onPress }: DriverMarkerProps) {
  const markerRef = useRef<any>(null);
  const rotateAnim = useRef(new Animated.Value(heading)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Анімація переміщення маркера
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.animateMarkerToCoordinate(coordinate, 1000);
    }
  }, [coordinate]);

  // Анімація повороту маркера
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: heading,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  // Пульсація якщо водій рухається
  useEffect(() => {
    if (speed && speed > 5) { // Якщо швидкість більше 5 км/год
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    } else {
      // Зупинити пульсацію якщо водій не рухається
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [speed]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Marker
      ref={markerRef}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          {
            transform: [
              { scale: pulseAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <View style={styles.markerInner}>
          <Ionicons name="car" size={24} color={Colors.white} />
        </View>
        
        {/* Тінь маркера */}
        <View style={styles.markerShadow} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerShadow: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
