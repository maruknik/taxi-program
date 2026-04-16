import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useRideHistory, RideHistoryItem as RideHistoryItemType } from '@/src/hooks/useRideHistory';
import { RideHistoryItemNew } from '@/src/components/ride/RideHistoryItemNew';
import { RideDetailModal } from '@/src/components/ride/RideDetailModal';

export default function RideHistoryScreen() {
  const router = useRouter();
  const { data: rides = [], isLoading, refetch, isRefetching } = useRideHistory();
  
  const [selectedRide, setSelectedRide] = useState<RideHistoryItemType | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);

  const handleRidePress = (ride: RideHistoryItemType) => {
    setSelectedRide(ride);
    setDetailModalVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailModalVisible(false);
    setSelectedRide(null);
  };

  const renderRideItem = ({ item }: { item: RideHistoryItemType }) => (
    <RideHistoryItemNew
      ride={item}
      onPress={() => handleRidePress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={64} color={Colors.grayText} />
      <Text style={styles.emptyTitle}>Поки що немає поїздок</Text>
      <Text style={styles.emptyDescription}>
        Ваші завершені поїздки з'являться тут
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Історія поїздок</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Історія поїздок</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Detail Modal */}
      {selectedRide && (
        <RideDetailModal
          visible={isDetailModalVisible}
          ride={selectedRide}
          onClose={handleCloseDetail}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Content
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
