import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@/src/utils/cache";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/lib/queryClient";
import { useAxiosInterceptors } from "@/src/hooks/useAxiosInterceptors";
import { LanguageProvider } from "@/src/context/LanguageContext";

function AppContent() {
  useAxiosInterceptors();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — " +
      "переконайтеся що файл client-app/.env заповнений",
  );
}

import { ErrorBoundary } from "@/src/components/ErrorBoundary";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
