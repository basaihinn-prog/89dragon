import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Image as RNImage, ActivityIndicator, TextInput, KeyboardAvoidingView, ScrollView, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { NeonButton } from "@/components/NeonButton";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, uploadAvatar } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors, PremiumColors } from "@/constants/theme";

const PROFILE_AVATARS = [
  { id: "dragon", source: require("@/attached_assets/generated_images/golden_dragon_profile_avatar.png"), name: "Dragon" },
  { id: "phoenix", source: require("@/attached_assets/generated_images/royal_phoenix_profile_avatar.png"), name: "Phoenix" },
  { id: "tiger", source: require("@/attached_assets/generated_images/noble_tiger_profile_avatar.png"), name: "Tiger" },
  { id: "cat", source: require("@/attached_assets/generated_images/lucky_cat_profile_avatar.png"), name: "Lucky Cat" },
  { id: "wolf", source: require("@/attached_assets/generated_images/mysterious_wolf_profile_avatar.png"), name: "Wolf" },
  { id: "owl", source: require("@/attached_assets/generated_images/wise_owl_profile_avatar.png"), name: "Owl" },
];

const AVATAR_STORAGE_KEY = "@jade_royale_avatar";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, token, refreshProfile } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    loadSavedAvatar();
  }, []);

  const loadSavedAvatar = async () => {
    try {
      const savedAvatarId = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedAvatarId) {
        setSelectedAvatarId(savedAvatarId);
      }
    } catch (error) {
      console.error("Error loading saved avatar:", error);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setAvatarUri(null);
    try {
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    } catch (error) {
      console.error("Error saving avatar:", error);
    }
  };

  const getSelectedAvatarSource = () => {
    if (selectedAvatarId) {
      const avatar = PROFILE_AVATARS.find(a => a.id === selectedAvatarId);
      return avatar?.source;
    }
    return null;
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photo library to change your avatar."
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        setAvatarUri(selectedUri);
        
        if (token) {
          setIsUploadingAvatar(true);
          const uploadResult = await uploadAvatar(token, selectedUri);
          setIsUploadingAvatar(false);
          
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      const updates: any = {};
      if (name !== user?.username) updates.name = name;
      if (email !== user?.email) updates.email = email;
      if (phone !== user?.phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        const result = await updateUserProfile(token, updates);
        
        if (result.success) {
          if (refreshProfile) {
            await refreshProfile();
          }
          Alert.alert("Success", "Profile updated successfully");
          navigation.goBack();
        } else {
          Alert.alert("Error", result.error || "Failed to update profile");
        }
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

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
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        }
      ]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingBottom: insets.bottom + Spacing.xl,
              paddingLeft: insets.left + Spacing.lg,
              paddingRight: insets.right + Spacing.lg,
            },
            isLandscape && styles.scrollContentLandscape,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.avatarSection, isLandscape && styles.avatarSectionLandscape]}>
            <View style={styles.currentAvatarContainer}>
              <View style={styles.avatarWrapper}>
                {getSelectedAvatarSource() ? (
                  <Image source={getSelectedAvatarSource()} style={styles.avatar} contentFit="cover" />
                ) : avatarUri ? (
                  <RNImage source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Feather name="user" size={48} color={NeonColors.green} />
                  </View>
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
              </View>
              <ThemedText style={styles.avatarHint}>
                {selectedAvatarId ? PROFILE_AVATARS.find(a => a.id === selectedAvatarId)?.name : "Select an avatar below"}
              </ThemedText>
            </View>

            <ThemedText style={styles.sectionTitle}>Choose Your Avatar</ThemedText>
            <View style={styles.avatarGrid}>
              {PROFILE_AVATARS.map((avatar) => (
                <Pressable
                  key={avatar.id}
                  onPress={() => handleSelectAvatar(avatar.id)}
                  style={({ pressed }) => [
                    styles.avatarOption,
                    selectedAvatarId === avatar.id && styles.avatarOptionSelected,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Image source={avatar.source} style={styles.avatarOptionImage} contentFit="cover" />
                  {selectedAvatarId === avatar.id && (
                    <View style={styles.avatarCheckmark}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handlePickImage} style={styles.uploadButton}>
              <Feather name="upload" size={16} color={NeonColors.purple} />
              <ThemedText style={styles.uploadButtonText}>Upload Custom Photo</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.formSection, isLandscape && styles.formSectionLandscape]}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Display Name</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="user" size={18} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={18} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={18} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <NeonButton
              onPress={handleSave}
              loading={isSaving}
              color={NeonColors.green}
              style={styles.saveButton}
            >
              Save Changes
            </NeonButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xl,
  },
  scrollContentLandscape: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: Spacing.xl,
    paddingTop: Spacing.md,
  },
  avatarSection: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  avatarSectionLandscape: {
    width: 280,
    marginTop: 0,
  },
  currentAvatarContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PremiumColors.royalGold,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GlassColors.cardGlass,
    borderWidth: 3,
    borderColor: NeonColors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 14,
    fontWeight: "600",
    color: PremiumColors.royalGold,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: Spacing.sm,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GlassColors.borderGlass,
    backgroundColor: GlassColors.cardGlass,
  },
  avatarOptionSelected: {
    borderColor: PremiumColors.royalGold,
    borderWidth: 3,
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  avatarCheckmark: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: NeonColors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: GlassColors.cardGlass,
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
  },
  uploadButtonText: {
    fontSize: 13,
    color: NeonColors.purple,
    fontWeight: "600",
  },
  formSection: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.lg,
  },
  formSectionLandscape: {
    flex: 1,
    maxWidth: 350,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
    marginTop: Spacing.lg,
  },
  saveButton: {
    width: "100%",
  },
});
