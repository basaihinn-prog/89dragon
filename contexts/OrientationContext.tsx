import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Dimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { Platform } from "react-native";

type OrientationType = "portrait" | "landscape";

interface OrientationContextType {
  orientation: OrientationType;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
}

const OrientationContext = createContext<OrientationContextType>({
  orientation: "landscape",
  isLandscape: true,
  isPortrait: false,
  screenWidth: Dimensions.get("window").width,
  screenHeight: Dimensions.get("window").height,
});

export function useOrientation() {
  return useContext(OrientationContext);
}

interface OrientationProviderProps {
  children: ReactNode;
}

export function OrientationProvider({ children }: OrientationProviderProps) {
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));
  
  const orientation: OrientationType = dimensions.width > dimensions.height ? "landscape" : "portrait";
  const isLandscape = orientation === "landscape";
  const isPortrait = orientation === "portrait";

  useEffect(() => {
    async function unlockOrientation() {
      if (Platform.OS !== "web") {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (e) {
        }
      }
    }
    unlockOrientation();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const value: OrientationContextType = {
    orientation,
    isLandscape,
    isPortrait,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };

  return (
    <OrientationContext.Provider value={value}>
      {children}
    </OrientationContext.Provider>
  );
}
