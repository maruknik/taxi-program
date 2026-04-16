import { Stack } from 'expo-router';

export default function RideLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen 
        name="confirmation" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="searching" 
        options={{ presentation: 'modal', gestureEnabled: false }} 
      />
      <Stack.Screen 
        name="tracking" 
        options={{ presentation: 'modal', gestureEnabled: false }} 
      />
      <Stack.Screen 
        name="rating" 
        options={{ presentation: 'modal', gestureEnabled: false }} 
      />
    </Stack>
  );
}
