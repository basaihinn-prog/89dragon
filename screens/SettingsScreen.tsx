import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Switch, Pressable, Linking, TextInput, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAudio } from "@/contexts/AudioContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/contexts/PushNotificationsContext";
import { changePassword } from "@/services/api";
import { IMAGE_BASE_URL } from "@/services/config";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors } from "@/constants/theme";
import Constants from "expo-constants";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isMusicEnabled, volume, setMusicEnabled, setVolume } = useAudio();
  const { token } = useAuth();
  const { isEnabled: pushEnabled, enableNotifications, disableNotifications, isLoading: pushLoading } = usePushNotifications();

  const isLandscape = screenWidth > screenHeight;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTermsPress = () => {
    Linking.openURL(`${IMAGE_BASE_URL}/terms`);
  };

  const handlePrivacyPress = () => {
    Linking.openURL(`${IMAGE_BASE_URL}/privacy`);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    if (!token) {
      Alert.alert("Error", "You must be logged in to change your password");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(token, currentPassword, newPassword);
      if (result.success) {
        Alert.alert("Success", "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", result.error || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handlePushNotificationToggle = async (value: boolean) => {
    if (value) {
      const success = await enableNotifications();
      if (!success) {
        Alert.alert(
          "Notifications",
          "Could not enable push notifications. Please check your device settings.",
          [{ text: "OK" }]
        );
      }
    } else {
      disableNotifications();
    }
  };

  const renderAudioSection = () => (
    <GlassCard style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Audio</ThemedText>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Feather name="music" size={18} color={NeonColors.green} />
          <ThemedText style={styles.settingLabel}>Background Music</ThemedText>
        </View>
        <Switch
          value={isMusicEnabled}
          onValueChange={setMusicEnabled}
          trackColor={{ false: GlassColors.darkGlass, true: NeonColors.green }}
          thumbColor="#FFFFFF"
        />
      </View>

      {isMusicEnabled ? (
        <View style={styles.volumeContainer}>
          <Feather name="volume" size={16} color="rgba(255, 255, 255, 0.6)" />
          <Slider
            style={styles.slider}
            value={volume}
            onValueChange={setVolume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={NeonColors.green}
            maximumTrackTintColor={GlassColors.darkGlass}
            thumbTintColor="#FFFFFF"
          />
          <Feather name="volume-2" size={16} color={NeonColors.green} />
        </View>
      ) : null}
    </GlassCard>
  );

  const renderNotificationsSection = () => (
    <GlassCard style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Feather name="bell" size={18} color={NeonColors.purple} />
          <View>
            <ThemedText style={styles.settingLabel}>Push Notifications</ThemedText>
            <ThemedText style={styles.settingHint}>
              Get reminders for spin wheel and bonuses
            </ThemedText>
          </View>
        </View>
        {pushLoading ? (
          <ActivityIndicator size="small" color={NeonColors.purple} />
        ) : (
          <Switch
            value={pushEnabled}
            onValueChange={handlePushNotificationToggle}
            trackColor={{ false: GlassColors.darkGlass, true: NeonColors.purple }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>
    </GlassCard>
  );

  const renderPasswordSection = () => (
    <GlassCard style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Change Password</ThemedText>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={16} color="rgba(255, 255, 255, 0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            secureTextEntry={!showCurrentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton}>
            <Feather name={showCurrentPassword ? "eye-off" : "eye"} size={16} color="rgba(255, 255, 255, 0.5)" />
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="key" size={16} color="rgba(255, 255, 255, 0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
            <Feather name={showNewPassword ? "eye-off" : "eye"} size={16} color="rgba(255, 255, 255, 0.5)" />
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="check-circle" size={16} color="rgba(255, 255, 255, 0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
            <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={16} color="rgba(255, 255, 255, 0.5)" />
          </Pressable>
        </View>

        <NeonButton
          onPress={handleChangePassword}
          loading={isChangingPassword}
          color={NeonColors.purple}
          style={styles.changePasswordButton}
        >
          Update Password
        </NeonButton>
      </View>
    </GlassCard>
  );

  const renderAboutSection = () => (
    <GlassCard style={styles.section}>
      <ThemedText style={styles.sectionTitle}>About</ThemedText>

      <View style={styles.aboutRow}>
        <ThemedText style={styles.aboutLabel}>Version</ThemedText>
        <ThemedText style={styles.aboutValue}>{appVersion}</ThemedText>
      </View>

      <Pressable
        onPress={handleTermsPress}
        style={({ pressed }) => [
          styles.linkRow,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
        <Feather name="external-link" size={16} color={NeonColors.blue} />
      </Pressable>

      <Pressable
        onPress={handlePrivacyPress}
        style={({ pressed }) => [
          styles.linkRow,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
        <Feather name="external-link" size={16} color={NeonColors.blue} />
      </Pressable>
    </GlassCard>
  );

  return (
    <LinearGradient
      colors={GradientColors.full}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />

      <View style={[
        styles.header, 
        { 
          paddingTop: insets.top + Spacing.sm,
          paddingLeft: insets.left + Spacing.md,
          paddingRight: insets.right + Spacing.md,
        }
      ]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: insets.bottom + Spacing.xl,
            paddingLeft: insets.left + Spacing.md,
            paddingRight: insets.right + Spacing.md,
          },
          isLandscape && styles.scrollContentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLandscape ? (
          <View style={styles.landscapeContainer}>
            <View style={styles.landscapeColumn}>
              {renderAudioSection()}
              {renderNotificationsSection()}
              {renderAboutSection()}
            </View>
            <View style={styles.landscapeColumn}>
              {renderPasswordSection()}
            </View>
          </View>
        ) : (
          <>
            {renderAudioSection()}
            {renderNotificationsSection()}
            {renderPasswordSection()}
            {renderAboutSection()}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  scrollContentLandscape: {
    paddingHorizontal: Spacing.lg,
  },
  landscapeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  landscapeColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingLabel: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  settingHint: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    height: 44,
    color: "#FFFFFF",
    fontSize: 14,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  changePasswordButton: {
    marginTop: Spacing.xs,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  aboutLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  aboutValue: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GlassColors.borderGlass,
  },
  linkText: {
    fontSize: 14,
    color: NeonColors.blue,
  },
});
