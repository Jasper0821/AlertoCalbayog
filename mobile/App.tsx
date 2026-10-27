import "./global.css";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Per-weight imports: the package index would bundle all 18 weights (~1MB).
import { PublicSans_400Regular } from '@expo-google-fonts/public-sans/400Regular';
import { PublicSans_600SemiBold } from '@expo-google-fonts/public-sans/600SemiBold';
import { PublicSans_700Bold } from '@expo-google-fonts/public-sans/700Bold';
import { PublicSans_800ExtraBold } from '@expo-google-fonts/public-sans/800ExtraBold';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element | null {
  // Bundled with the app, so this resolves in milliseconds. If loading fails the
  // app still starts with the system font rather than staying blank.
  const [fontsLoaded, fontError] = useFonts({
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    // Not 100vh: on phone browsers 100vh includes the area behind the address bar and
    // toolbar, and the page cannot scroll (body is overflow:hidden), so anything pinned
    // to the bottom — like the report screen's Send button — was pushed off-screen.
    // 100% follows the visible area, as html/body/#root are 100% in Expo's template.
    <SafeAreaProvider style={{ flex: 1, height: '100%' }}>
      <AppNavigator />
      {/* SDK 57 makes Android edge-to-edge mandatory, which removed the status
          bar `backgroundColor` prop. Screens paint behind it instead. */}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
