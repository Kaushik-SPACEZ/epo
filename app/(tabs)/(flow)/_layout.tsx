import { Stack } from 'expo-router';

export default function FlowStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="product-selection" />
      <Stack.Screen name="user-details" />
      <Stack.Screen name="order-summary" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}
