import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { SplashVideo } from '@/components/SplashVideo';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Hide the Expo splash screen immediately when component mounts
    SplashScreen.hideAsync();
    
    // Mark app as ready after a short delay to ensure Stack is mounted
    const timer = setTimeout(() => setAppReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSplashFinish = () => {
    // Only hide splash if app is ready
    if (appReady) {
      setShowSplash(false);
    } else {
      // Wait for app to be ready
      const checkReady = setInterval(() => {
        if (appReady) {
          clearInterval(checkReady);
          setShowSplash(false);
        }
      }, 50);
    }
  };

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <OrderProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
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
