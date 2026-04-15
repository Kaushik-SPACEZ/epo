import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { SplashVideo } from '@/components/SplashVideo';

const SPLASH_SHOWN_KEY = '@splash_shown';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    AsyncStorage.getItem(SPLASH_SHOWN_KEY).then(value => {
      if (!value) {
        setShowSplash(true);
      }
    });
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    // Mark splash as shown for this session
    AsyncStorage.setItem(SPLASH_SHOWN_KEY, 'true');
  };

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <OrderProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              {/* Auth flow */}
              <Stack.Screen name="auth" options={{ presentation: 'card' }} />
              <Stack.Screen name="forgot-password" options={{ presentation: 'card' }} />
              <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
              {/* Order flow — root stack so back() correctly pops */}
              <Stack.Screen name="product-selection" options={{ presentation: 'card' }} />
              <Stack.Screen name="user-details" options={{ presentation: 'card' }} />
              <Stack.Screen name="order-summary" options={{ presentation: 'card' }} />
            </Stack>

            {/* Logo animation — overlays everything until video finishes */}
            {showSplash && (
              <SplashVideo onFinish={handleSplashFinish} />
            )}
          </OrderProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
