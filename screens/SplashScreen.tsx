import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

interface SplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useSharedValue(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      opacity.value = withDelay(
        500,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        })
      );
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <StatusBar style="light" hidden />
      <Image
        source={require("../assets/videos/splash.gif")}
        style={styles.video}
        contentFit="cover"
        transition={0}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
