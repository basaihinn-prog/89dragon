import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/services/api";
import SplashScreen from "@/screens/SplashScreen";
import LoginScreen from "@/screens/LoginScreen";
import MainGalleryScreen from "@/screens/MainGalleryScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import GameScreen from "@/screens/GameScreen";
import TransactionHistoryScreen from "@/screens/TransactionHistoryScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import WithdrawalScreen from "@/screens/WithdrawalScreen";
import DepositScreen from "@/screens/DepositScreen";
import ReferralScreen from "@/screens/ReferralScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainGallery: undefined;
  Profile: undefined;
  Settings: undefined;
  Game: { game: Game };
  TransactionHistory: undefined;
  EditProfile: undefined;
  Withdrawal: undefined;
  Deposit: undefined;
  Referral: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, hasSeenSplash, setHasSeenSplash } = useAuth();
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
  };

  if (isLoading) {
    return null;
  }

  if (showSplash && !hasSeenSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#0D0D0D" },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainGallery" component={MainGalleryScreen} />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              animation: "fade",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="TransactionHistory"
            component={TransactionHistoryScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Withdrawal"
            component={WithdrawalScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Deposit"
            component={DepositScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Referral"
            component={ReferralScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_right",
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
