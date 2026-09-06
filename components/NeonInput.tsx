import React, { useState } from "react";
import { View, TextInput, StyleSheet, Pressable, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { NeonColors, Spacing, BorderRadius } from "@/constants/theme";

interface NeonInputProps extends TextInputProps {
  icon?: keyof typeof Feather.glyphMap;
  error?: boolean;
}

export function NeonInput({ icon, error, secureTextEntry, style, ...props }: NeonInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const glowOpacity = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    glowOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const glowColor = error ? NeonColors.pink : NeonColors.green;
  const borderColor = error
    ? NeonColors.pink
    : isFocused
    ? NeonColors.green
    : "rgba(255, 255, 255, 0.4)";

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View 
        style={[
          styles.glowLayer, 
          { boxShadow: `0px 0px 12px ${glowColor}80`, pointerEvents: "none" },
          animatedGlowStyle,
        ]} 
      />
      <View style={[styles.container, { borderColor }]}>
        {icon ? (
          <Feather
            name={icon}
            size={20}
            color={isFocused ? NeonColors.green : "rgba(255, 255, 255, 0.5)"}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="rgba(255, 255, 255, 0.5)"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  glowLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    height: "100%",
  },
  eyeButton: {
    padding: Spacing.xs,
  },
});
