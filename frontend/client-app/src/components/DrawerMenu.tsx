import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/src/constants/theme";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.82;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      slideAnim.stopAnimation();
      overlayOpacity.stopAnimation();

      slideAnim.setValue(-DRAWER_WIDTH);
      overlayOpacity.setValue(0);

      setIsModalVisible(true);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 440,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 360,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 340,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsModalVisible(false);
      });
    }
  }, [visible]);

  const handleLogout = async () => {
    try {
      await signOut();
      onClose?.();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const goToProfile = () => {
    onClose?.();
    requestAnimationFrame(() => {
      router.push("/(app)/profile");
    });
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: overlayOpacity },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >

          {/* ✅ PROFILE SECTION (ТЕПЕР КЛІКАБЕЛЬНИЙ) */}
          <TouchableOpacity
            style={styles.profileSection}
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <View style={styles.profileContent}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={Colors.white} />
                </View>
              )}

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>
                  {user?.firstName || "Користувач"}
                </Text>
                <Text style={styles.profileLabel}>Мій профіль</Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.grayText}
            />
          </TouchableOpacity>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Рейтинг</Text>
            <View style={styles.ratingValue}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="business-outline" size={24} color={Colors.black} />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Місто</Text>
                <Text style={styles.menuItemSubtitle}>Хмельницький</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose?.();
                router.push("/(app)/ride");
              }}
            >
              <Ionicons name="time-outline" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Поїздки</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose?.();
                router.push("/(app)/payment");
              }}
            >
              <Ionicons name="card-outline" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Оплата</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Help */}
          <View style={styles.helpSection}>
            <Text style={styles.helpLabel}>Допомога</Text>
            <TouchableOpacity style={styles.helpItem} onPress={() => { onClose(); router.push('/(app)/about'); }}>
              <Text style={styles.helpItemText}>Про сервіс</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  profileLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.grayText,
    marginRight: 8,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.black,
  },
  menuSection: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.grayText,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
  helpSection: {
    marginBottom: 16,
  },
  helpLabel: {
    fontSize: 14,
    color: Colors.grayText,
    marginBottom: 12,
  },
  helpItem: {
    paddingVertical: 8,
  },
  helpItemText: {
    fontSize: 16,
    color: Colors.black,
  },
  actionButtons: {
    marginTop: "auto",
    paddingBottom: 40,
    gap: 12,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5B4",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
  },
  driverButton: {
    backgroundColor: Colors.lightGray,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: "relative",
  },
  driverButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
    marginBottom: 4,
    paddingRight: 24,
  },
  driverButtonSubtext: {
    fontSize: 13,
    color: Colors.grayText,
    paddingRight: 24,
  },
  driverButtonIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
});
