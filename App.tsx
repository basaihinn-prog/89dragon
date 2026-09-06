import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { GamesProvider } from "@/contexts/GamesContext";
import { DailyBonusProvider } from "@/contexts/DailyBonusContext";
import { SpinWheelProvider } from "@/contexts/SpinWheelContext";
import { BonusCreditsProvider } from "@/contexts/BonusCreditsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PushNotificationsProvider } from "@/contexts/PushNotificationsContext";
import { ReferralProvider } from "@/contexts/ReferralContext";
import { OrientationProvider } from "@/contexts/OrientationContext";
import { DragonEggBonusModal } from "@/components/DragonEggBonusModal";
import { SpinWheelModal } from "@/components/SpinWheelModal";
import { NotificationsModal } from "@/components/NotificationsModal";
import { ActivityTracker } from "@/components/ActivityTracker";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";

export default function App() {

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <OrientationProvider>
              <AuthProvider>
                <ActivityTracker>
                  <AudioProvider>
                    <GamesProvider>
                      <BonusCreditsProvider>
                        <DailyBonusProvider>
                          <SpinWheelProvider>
                            <ReferralProvider>
                              <NotificationsProvider>
                                <PushNotificationsProvider>
                                  <NavigationContainer>
                                    <RootNavigator />
                                    <DragonEggBonusModal />
                                    <SpinWheelModal />
                                    <NotificationsModal />
                                    <IOSInstallPrompt />
                                  </NavigationContainer>
                                </PushNotificationsProvider>
                              </NotificationsProvider>
                            </ReferralProvider>
                          </SpinWheelProvider>
                        </DailyBonusProvider>
                      </BonusCreditsProvider>
                    </GamesProvider>
                  </AudioProvider>
                </ActivityTracker>
              </AuthProvider>
            </OrientationProvider>
            <StatusBar style="light" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
});
