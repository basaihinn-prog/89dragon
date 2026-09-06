import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { NeonButton } from "@/components/NeonButton";
import { NeonInput } from "@/components/NeonInput";
import { useAuth } from "@/contexts/AuthContext";
import { NeonColors, Spacing, BorderRadius, createBoxShadow, createTextShadow } from "@/constants/theme";

const jadeRoyaleLogo = require("../attached_assets/Remove_background_project_1764881973873.png");


interface FloatingOrbProps {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
  duration: number;
}

function FloatingOrb({ delay, startX, startY, size, color, duration }: FloatingOrbProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(30, { duration: duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    translateX.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(20, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0px 0px ${size / 2}px ${color}CC`,
        },
        animatedStyle,
      ]}
    />
  );
}

interface SparkleProps {
  delay: number;
  x: number;
  y: number;
  size: number;
}

function Sparkle({ delay, x, y, size }: SparkleProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 1000 })
        ),
        -1
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 1000 })
        ),
        -1
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(180, { duration: 2000, easing: Easing.linear }),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.sparkleCore, { width: size, height: size }]}>
        <LinearGradient
          colors={["#FFD700", "#FFF8DC", "#FFD700"]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.sparkleRay, styles.sparkleRayH, { width: size * 2, height: size * 0.3, left: -size * 0.5, top: size * 0.35 }]} />
      <View style={[styles.sparkleRay, styles.sparkleRayV, { width: size * 0.3, height: size * 2, left: size * 0.35, top: -size * 0.5 }]} />
    </Animated.View>
  );
}

function AnimatedBorder() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.animatedBorderContainer, animatedStyle]}>
      <LinearGradient
        colors={["#FFD700", "#FFA500", "#FF8C00", "#FFD700", "#B8860B", "#FFD700"]}
        style={styles.animatedBorderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

function GlowingBorder() {
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.glowingBorder, animatedStyle]}>
      <LinearGradient
        colors={["#FFD700", "#FFA500"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

const orbConfigs = [
  { delay: 0, xPercent: 0.1, yPercent: 0.2, size: 80, color: NeonColors.green, duration: 4000 },
  { delay: 500, xPercent: 0.8, yPercent: 0.15, size: 60, color: NeonColors.blue, duration: 3500 },
  { delay: 1000, xPercent: 0.7, yPercent: 0.7, size: 100, color: NeonColors.purple, duration: 5000 },
  { delay: 1500, xPercent: 0.15, yPercent: 0.75, size: 70, color: NeonColors.pink, duration: 4500 },
  { delay: 2000, xPercent: 0.5, yPercent: 0.1, size: 50, color: NeonColors.blue, duration: 3000 },
  { delay: 800, xPercent: 0.85, yPercent: 0.5, size: 40, color: NeonColors.green, duration: 3800 },
  { delay: 1200, xPercent: 0.05, yPercent: 0.5, size: 55, color: NeonColors.blue, duration: 4200 },
];

const sparkleConfigs = [
  { delay: 0, xPercent: 0.05, yPercent: 0.07, size: 8 },
  { delay: 800, xPercent: 0.92, yPercent: 0.14, size: 10 },
  { delay: 400, xPercent: 0.1, yPercent: 0.4, size: 6 },
  { delay: 1200, xPercent: 0.9, yPercent: 0.35, size: 8 },
  { delay: 600, xPercent: 0.5, yPercent: 0.11, size: 7 },
  { delay: 1000, xPercent: 0.07, yPercent: 0.6, size: 9 },
  { delay: 200, xPercent: 0.93, yPercent: 0.55, size: 6 },
  { delay: 1400, xPercent: 0.3, yPercent: 0.8, size: 8 },
  { delay: 900, xPercent: 0.7, yPercent: 0.85, size: 7 },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const orbs = useMemo(() => 
    orbConfigs.map(config => ({
      delay: config.delay,
      startX: width * config.xPercent,
      startY: height * config.yPercent,
      size: config.size,
      color: config.color,
      duration: config.duration,
    })),
    [width, height]
  );

  const sparkles = useMemo(() => 
    sparkleConfigs.map(config => ({
      delay: config.delay,
      x: width * config.xPercent,
      y: height * config.yPercent,
      size: config.size,
    })),
    [width, height]
  );

  const titleGlow = useSharedValue(0.5);

  useEffect(() => {
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const titleGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(titleGlow.value, [0.5, 1], [0.9, 1]),
  }));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(username.trim(), password);

      setIsLoading(false);

      if (result.success) {
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      console.error("=== HANDLE LOGIN ERROR ===", err);
      setIsLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={["#0a0a1a", "#1a0a2e", "#0f0520", "#0a0a1a"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.orbsContainer}>
        {orbs.map((orb, index) => (
          <FloatingOrb key={index} {...orb} />
        ))}
      </View>

      <View style={styles.sparklesContainer}>
        {sparkles.map((sparkle, index) => (
          <Sparkle key={index} {...sparkle} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + (isLandscape ? Spacing.md : Spacing.xl),
              paddingBottom: insets.bottom + (isLandscape ? Spacing.md : Spacing.xl),
              paddingLeft: insets.left + Spacing.xl,
              paddingRight: insets.right + Spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.formContainer,
            isLandscape && styles.formContainerLandscape
          ]}>
            <Image
              source={jadeRoyaleLogo}
              style={isLandscape ? styles.logoLandscape : styles.logo}
              contentFit="contain"
            />
            
            <View style={styles.cardWrapper}>
              <GlowingBorder />
              <View style={styles.cardBorderOuter}>
                <LinearGradient
                  colors={["#FFD700", "#B8860B", "#8B6914", "#B8860B", "#FFD700"]}
                  style={styles.cardBorderGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardBorderInner}>
                    <BlurView intensity={60} tint="dark" style={styles.card}>
                      <LinearGradient
                        colors={["rgba(26, 10, 46, 0.9)", "rgba(15, 5, 32, 0.95)", "rgba(10, 10, 26, 0.9)"]}
                        style={styles.cardGradient}
                      >
                        <View style={styles.cardInner}>
                          <View style={styles.decorativeLine}>
                            <View style={styles.lineWing} />
                            <View style={styles.lineDiamond}>
                              <LinearGradient
                                colors={["#FFD700", "#FFA500"]}
                                style={styles.diamondGradient}
                              />
                            </View>
                            <View style={styles.lineWing} />
                          </View>

                          <Animated.Text style={[styles.welcomeText, titleGlowStyle]}>
                            Welcome Back
                          </Animated.Text>

                          <ThemedText style={styles.subtitleText}>
                            Sign in to continue playing
                          </ThemedText>

                          <View style={styles.decorativeLine}>
                            <View style={styles.lineWing} />
                            <View style={styles.lineDiamond}>
                              <LinearGradient
                                colors={["#FFD700", "#FFA500"]}
                                style={styles.diamondGradient}
                              />
                            </View>
                            <View style={styles.lineWing} />
                          </View>

                          {error ? (
                            <View style={styles.errorContainer}>
                              <ThemedText style={styles.errorText}>{error}</ThemedText>
                            </View>
                          ) : null}

                          <View style={styles.inputsContainer}>
                            <NeonInput
                              icon="user"
                              placeholder="Username"
                              value={username}
                              onChangeText={setUsername}
                              autoCapitalize="none"
                              autoCorrect={false}
                              error={!!error}
                            />
                            <NeonInput
                              icon="lock"
                              placeholder="Password"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry
                              error={!!error}
                            />
                          </View>

                          <ThemedText style={styles.helpText}>
                            Contact your agent for help with login
                          </ThemedText>

                          <NeonButton
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading}
                            variant="royale"
                            style={styles.loginButton}
                          >
                            Sign In
                          </NeonButton>

                          <View style={styles.footerDecoration}>
                            <View style={styles.footerLine} />
                            <ThemedText style={styles.footerText}>JADE ROYALE</ThemedText>
                            <View style={styles.footerLine} />
                          </View>
                        </View>
                      </LinearGradient>
                    </BlurView>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  sparklesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 2,
  },
  sparkleCore: {
    borderRadius: 100,
    overflow: "hidden",
  },
  sparkleRay: {
    position: "absolute",
    backgroundColor: "rgba(255, 215, 0, 0.6)",
    borderRadius: 100,
  },
  sparkleRayH: {},
  sparkleRayV: {},
  keyboardView: {
    flex: 1,
    zIndex: 3,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  formContainer: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  formContainerLandscape: {
    flexDirection: "row",
    maxWidth: 600,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  logo: {
    width: 420,
    height: 350,
    marginBottom: Spacing.md,
  },
  logoLandscape: {
    width: 200,
    height: 160,
    marginBottom: 0,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 280,
    position: "relative",
  },
  glowingBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xl + 4,
    ...createBoxShadow("#FFD700", 0, 0, 0.5, 20, 10),
  },
  animatedBorderContainer: {
    position: "absolute",
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedBorderGradient: {
    width: "150%",
    height: "150%",
  },
  cardBorderOuter: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  cardBorderGradient: {
    padding: 2,
    borderRadius: BorderRadius.xl,
  },
  cardBorderInner: {
    borderRadius: BorderRadius.xl - 2,
    overflow: "hidden",
  },
  card: {
    borderRadius: BorderRadius.xl - 2,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: BorderRadius.xl - 2,
  },
  cardInner: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  decorativeLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  lineWing: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
  },
  lineDiamond: {
    width: 10,
    height: 10,
    marginHorizontal: Spacing.md,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
  },
  diamondGradient: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: Spacing.xs,
    ...createTextShadow("#FFA500", 0, 0, 10),
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 51, 102, 0.2)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 51, 102, 0.5)",
  },
  errorText: {
    color: "#FF6B8A",
    fontSize: 14,
    textAlign: "center",
  },
  inputsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  helpText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  loginButton: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  footerDecoration: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 215, 0, 0.4)",
    letterSpacing: 3,
    marginHorizontal: Spacing.md,
  },
});
