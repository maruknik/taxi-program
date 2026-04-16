import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // Якщо користувач вже залогований — перенаправляємо на головний екран
  if (isSignedIn) {
    return <Redirect href="/(app)/main" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="login-email" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
