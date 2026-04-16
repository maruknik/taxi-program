import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, SearchIcon, LocationIcon } from '@/src/components/icons';
import { Colors } from '@/src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRideStore } from '@/src/store/useRideStore';

export default function SearchScreen() {
  const router = useRouter();
  const { pickupLocation, dropoffLocation, setPickupLocation, setDropoffLocation } = useRideStore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Куди поїдемо?</Text>
      </View>

      {/* Search Input Container */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <View style={styles.dotCurrent} />
          <TextInput
            placeholder="Ваша локація"
            style={styles.input}
            placeholderTextColor={Colors.grayText}
            defaultValue="Моє місцеположення"
          />
        </View>

        <View style={styles.connector} />

        <View style={styles.inputWrapper}>
          <View style={styles.dotDestination} />
          <TextInput
            placeholder="Куди поїдемо?"
            style={[styles.input, styles.inputActive]}
            placeholderTextColor={Colors.grayText}
            autoFocus
          />
        </View>
      </View>

      {/* Suggested Locations */}
      <View style={styles.resultsContainer}>
        <TouchableOpacity style={styles.resultItem}>
          <View style={styles.iconCircle}>
            <LocationIcon size={20} color={Colors.darkGray} />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>Вказати на карті</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  dotCurrent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  dotDestination: {
    width: 8,
    height: 8,
    backgroundColor: Colors.black,
    marginRight: 12,
  },
  connector: {
    width: 2,
    height: 15,
    backgroundColor: Colors.mediumGray,
    marginLeft: 23,
    marginVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  inputActive: {
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.mediumGray,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
});
