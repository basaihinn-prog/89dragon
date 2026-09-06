import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityTrackerProps {
  children: ReactNode;
}

export function ActivityTracker({ children }: ActivityTrackerProps) {
  const { updateActivity, isAuthenticated } = useAuth();

  const handleStartShouldSetResponder = () => {
    if (isAuthenticated) {
      updateActivity();
    }
    return false;
  };

  return (
    <View 
      style={styles.container}
      onStartShouldSetResponder={handleStartShouldSetResponder}
      onStartShouldSetResponderCapture={() => false}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
