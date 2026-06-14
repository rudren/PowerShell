import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomSplash from './src/screens/SplashScreen';
import { paperTheme } from './src/utils/theme';
import * as Notifications from 'expo-notifications';

// Keep the native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide native splash immediately and show our custom JS splash instead
    SplashScreen.hideAsync();
  }, []);

  if (showSplash) {
    return <CustomSplash onDone={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
