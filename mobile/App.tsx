import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    // @ts-ignore: React Native Web supports vh but types don't officially
    <SafeAreaProvider style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : '100%' }}>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
