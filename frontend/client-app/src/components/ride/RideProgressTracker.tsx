import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface RideProgressTrackerProps {
  rideStatus: string;
  startTime?: Date;
  estimatedDuration?: number;
  currentPrice?: number;
}

export function RideProgressTracker({
  rideStatus,
  startTime,
  estimatedDuration = 0,
  currentPrice = 0,
}: RideProgressTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);

  useEffect(() => {
    if (rideStatus === 'in_progress' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rideStatus, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!startTime || estimatedDuration === 0) return 0;
    const progress = (elapsedTime / 60) / estimatedDuration;
    return Math.min(progress * 100, 100);
  };

  if (rideStatus !== 'in_progress') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time" size={20} color={Colors.primary} />
        <Text style={styles.title}>Поїздка в процесі</Text>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${getProgressPercentage()}%` }
          ]} 
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.statLabel}>Час</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>{currentDistance.toFixed(1)} км</Text>
          <Text style={styles.statLabel}>Відстань</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(currentPrice)} ₴</Text>
          <Text style={styles.statLabel}>Вартість</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grayText,
  },
});
