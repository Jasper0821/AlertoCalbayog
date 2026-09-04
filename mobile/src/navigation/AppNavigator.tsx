import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import PasswordLoginScreen from "../screens/PasswordLoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import HomeScreen from "../screens/HomeScreen";
import EmergencyReportScreen from "../screens/EmergencyReportScreen";
import LiveTrackingScreen from "../screens/LiveTrackingScreen";
import ReportHistoryScreen from "../screens/ReportHistoryScreen";
import UserAgreementScreen from "../screens/UserAgreementScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import UserProfileScreen from "../screens/UserProfileScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  PasswordLogin: undefined;
  // Params are only present when finishing a Google sign-up: the account is
  // already verified by Google, so the screen just collects the mobile number.
  Register:
    | {
        googleRegistrationToken: string;
        googleUser: {
          google_email: string;
          full_name: string;
          profile_picture?: string;
        };
      }
    | undefined;
  OtpVerification: {
    email: string;
    mode?: "registration" | "forgot_password";
    registerData?: {
      fullName: string;
      phoneNumber: string;
      password: string;
      role: string;
    };
  };
  ForgotPassword: { step?: "request" | "verify" | "reset"; resetToken?: string; email?: string } | undefined;
  Home: undefined;
  EmergencyReport: { emergencyType: string };
  LiveTracking: { reportId: string; latitude: number; longitude: number; emergencyType: string; reportStatus?: string };
  ReportHistory: undefined;
  UserAgreement: undefined;
  Notifications: undefined;
  Settings: undefined;
  UserProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PasswordLogin" component={PasswordLoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EmergencyReport" component={EmergencyReportScreen} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
        <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
        <Stack.Screen name="UserAgreement" component={UserAgreementScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}