import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="add-card" 
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="test-processor" 
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
