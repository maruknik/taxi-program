import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

const APP_VERSION = '1.0.0';

const SOCIAL_LINKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook' as const,
    iconColor: '#1877F2',
    url: 'https://facebook.com',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram' as const,
    iconColor: '#C13584',
    url: 'https://instagram.com',
  },
];

const LEGAL_ITEMS = [
  { id: 'terms', label: 'Угода користувача', url: 'https://vard.app/terms' },
  { id: 'privacy', label: 'Політика конфіденційності', url: 'https://vard.app/privacy' },
  { id: 'licenses', label: 'Ліцензії', url: 'https://vard.app/licenses' },
  { id: 'etiquette', label: 'Етикет поведінки під час поїздки', url: 'https://vard.app/etiquette' },
];

export default function AboutScreen() {
  const router = useRouter();

  const handleLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Помилка', 'Не вдалося відкрити посилання');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Про сервіс</Text>

      {/* Соціальні мережі */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Соціальні мережі</Text>
        <View style={styles.card}>
          {SOCIAL_LINKS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleLink(item.url)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={28} color={item.iconColor} />
                <Text style={styles.rowText}>{item.name}</Text>
              </TouchableOpacity>
              {index < SOCIAL_LINKS.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Юридична інформація */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Юридична інформація</Text>
        <View style={styles.card}>
          {LEGAL_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleLink(item.url)}
                activeOpacity={0.7}
              >
                <Text style={styles.rowText}>{item.label}</Text>
              </TouchableOpacity>
              {index < LEGAL_ITEMS.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Версія */}
      <Text style={styles.version}>Версія програми: {APP_VERSION}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.grayText,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    color: Colors.black,
  },
  separator: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginHorizontal: 16,
  },
  version: {
    paddingHorizontal: 20,
    fontSize: 13,
    color: Colors.grayText,
  },
});
