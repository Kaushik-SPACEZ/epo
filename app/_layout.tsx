import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { SplashVideo } from '@/components/SplashVideo';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <OrderProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              {/* Auth flow */}
              <Stack.Screen name="auth" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="privacy-policy" />
              {/* Order flow — root stack so back() correctly pops */}
              <Stack.Screen name="product-selection" />
              <Stack.Screen name="user-details" />
              <Stack.Screen name="order-summary" />
            </Stack>

            {/* Logo animation — overlays everything until video finishes */}
            {showSplash && (
              <SplashVideo onFinish={() => setShowSplash(false)} />
            )}
          </OrderProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
