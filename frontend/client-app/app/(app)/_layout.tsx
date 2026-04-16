import { Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "@/src/constants/theme";

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Перевірка аутентифікації
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/(auth)/login");
    }
  }, [isSignedIn, isLoaded, router]);

  // Показати loading поки перевіряємо auth
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Якщо не залогований - не показувати контент (useEffect зробить редирект)
  if (!isSignedIn) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="main" />
      <Stack.Screen name="search" />
      <Stack.Screen name="ride" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
