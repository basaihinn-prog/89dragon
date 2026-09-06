import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, useWindowDimensions, Platform, Share } from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useReferral } from "@/contexts/ReferralContext";
import { useAuth } from "@/contexts/AuthContext";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors, PremiumColors } from "@/constants/theme";

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { stats, recentReferrals, isLoading, error, fetchReferralData, claimRewards } = useReferral();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const copiedCodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedLinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedCodeTimeoutRef.current) clearTimeout(copiedCodeTimeoutRef.current);
      if (copiedLinkTimeoutRef.current) clearTimeout(copiedLinkTimeoutRef.current);
    };
  }, []);

  const isLandscape = screenWidth > screenHeight;

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleCopyCode = async () => {
    if (!stats?.referralCode) return;
    
    try {
      await Clipboard.setStringAsync(stats.referralCode);
      setCopiedCode(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (copiedCodeTimeoutRef.current) clearTimeout(copiedCodeTimeoutRef.current);
      copiedCodeTimeoutRef.current = setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCopyLink = async () => {
    if (!stats?.referralLink) return;
    
    try {
      await Clipboard.setStringAsync(stats.referralLink);
      setCopiedLink(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (copiedLinkTimeoutRef.current) clearTimeout(copiedLinkTimeoutRef.current);
      copiedLinkTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!stats || !stats.referralCode || stats.referralCode === "Loading...") {
      Alert.alert("Please Wait", "Referral information is still loading. Please try again in a moment.");
      return;
    }

    const bonus = stats.refereeBonus?.toFixed(2) || "5.00";
    const message = `Join me on Jade Royale and get $${bonus} FREE when you sign up!\n\nUse my referral code: ${stats.referralCode}\n\nSign up here: ${stats.referralLink}`;

    try {
      if (Platform.OS !== "web") {
        const result = await Share.share({
          message,
          title: "Join Jade Royale",
        });
        if (result.action === Share.dismissedAction) {
          // User dismissed share dialog - no action needed
        }
      } else {
        await Clipboard.setStringAsync(message);
        Alert.alert("Copied!", "Referral message copied to clipboard. Share it with your friends!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
      Alert.alert("Share Failed", "Unable to share. Please try copying your referral code instead.");
    }
  };

  const handleClaimRewards = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    const result = await claimRewards();
    
    if (result.success) {
      Alert.alert("Rewards Claimed!", result.message);
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GradientColors.velvetNight}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Feather name="users" size={20} color={PremiumColors.royalGold} />
          <ThemedText style={styles.headerTitle}>Refer Friends</ThemedText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
          isLandscape && styles.contentLandscape
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={[styles.heroCard, isLandscape && styles.heroCardLandscape]}>
          <LinearGradient
            colors={["rgba(212, 175, 55, 0.15)", "rgba(212, 175, 55, 0.05)"]}
            style={styles.heroBanner}
          >
            <View style={styles.heroIconContainer}>
              <Feather name="gift" size={32} color={PremiumColors.royalGold} />
            </View>
            <ThemedText style={styles.heroTitle}>Earn $5 Per Referral</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Share your code and you both get $5 when they sign up!
            </ThemedText>
          </LinearGradient>

          <View style={styles.codeSection}>
            <ThemedText style={styles.codeLabel}>Your Referral Code</ThemedText>
            <View style={styles.codeContainer}>
              <ThemedText style={styles.codeText}>
                {stats?.referralCode || "Loading..."}
              </ThemedText>
              <Pressable onPress={handleCopyCode} style={styles.copyButton}>
                <Feather 
                  name={copiedCode ? "check" : "copy"} 
                  size={18} 
                  color={copiedCode ? NeonColors.green : "#FFFFFF"} 
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.linkSection}>
            <ThemedText style={styles.linkLabel}>Referral Link</ThemedText>
            <View style={styles.linkContainer}>
              <ThemedText style={styles.linkText} numberOfLines={1}>
                {stats?.referralLink || "Loading..."}
              </ThemedText>
              <Pressable onPress={handleCopyLink} style={styles.copyButton}>
                <Feather 
                  name={copiedLink ? "check" : "copy"} 
                  size={18} 
                  color={copiedLink ? NeonColors.green : "#FFFFFF"} 
                />
              </Pressable>
            </View>
          </View>

          <Pressable onPress={handleShare} style={styles.shareButton}>
            <LinearGradient
              colors={[PremiumColors.royalGold, "#B8860B"]}
              style={styles.shareButtonGradient}
            >
              <Feather name="share-2" size={20} color="#FFFFFF" />
              <ThemedText style={styles.shareButtonText}>Share with Friends</ThemedText>
            </LinearGradient>
          </Pressable>
        </GlassCard>

        <View style={[styles.statsRow, isLandscape && styles.statsRowLandscape]}>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(16, 185, 129, 0.2)" }]}>
              <Feather name="users" size={20} color={NeonColors.green} />
            </View>
            <ThemedText style={styles.statValue}>{stats?.totalReferrals || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Referrals</ThemedText>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(212, 175, 55, 0.2)" }]}>
              <Feather name="dollar-sign" size={20} color={PremiumColors.royalGold} />
            </View>
            <ThemedText style={styles.statValue}>${stats?.totalEarned?.toFixed(2) || "0.00"}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Earned</ThemedText>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(139, 92, 246, 0.2)" }]}>
              <Feather name="clock" size={20} color="#8B5CF6" />
            </View>
            <ThemedText style={styles.statValue}>{stats?.pendingReferrals || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </GlassCard>
        </View>

        {stats && stats.pendingRewards > 0 && (
          <GlassCard style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <Feather name="gift" size={24} color={NeonColors.green} />
              <View style={styles.rewardsTextContainer}>
                <ThemedText style={styles.rewardsTitle}>Rewards Available!</ThemedText>
                <ThemedText style={styles.rewardsAmount}>
                  ${stats.pendingRewards.toFixed(2)} ready to claim
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={handleClaimRewards} style={styles.claimButton} disabled={isLoading}>
              <LinearGradient
                colors={[NeonColors.green, "#059669"]}
                style={styles.claimButtonGradient}
              >
                <ThemedText style={styles.claimButtonText}>
                  {isLoading ? "Claiming..." : "Claim Rewards"}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        )}

        <GlassCard style={styles.howItWorksCard}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={18} color={PremiumColors.royalGold} />
            <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
          </View>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>1</ThemedText>
              </View>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Share Your Code</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  Send your unique referral code or link to friends
                </ThemedText>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>2</ThemedText>
              </View>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Friend Signs Up</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  They create an account using your referral code
                </ThemedText>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>3</ThemedText>
              </View>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Both Get Rewarded</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  You get ${stats?.referrerBonus?.toFixed(2) || "5.00"} and they get ${stats?.refereeBonus?.toFixed(2) || "5.00"}!
                </ThemedText>
              </View>
            </View>
          </View>
        </GlassCard>

        {recentReferrals.length > 0 && (
          <GlassCard style={styles.recentCard}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={18} color={PremiumColors.royalGold} />
              <ThemedText style={styles.sectionTitle}>Recent Referrals</ThemedText>
            </View>

            {recentReferrals.map((referral) => (
              <View key={referral.id} style={styles.referralItem}>
                <View style={styles.referralAvatar}>
                  <Feather name="user" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.referralInfo}>
                  <ThemedText style={styles.referralName}>{referral.username}</ThemedText>
                  <ThemedText style={styles.referralDate}>{referral.date}</ThemedText>
                </View>
                <View style={[
                  styles.referralStatus,
                  referral.status === "completed" && styles.referralStatusCompleted
                ]}>
                  <ThemedText style={[
                    styles.referralStatusText,
                    referral.status === "completed" && styles.referralStatusTextCompleted
                  ]}>
                    {referral.status === "completed" ? `+$${referral.bonus.toFixed(2)}` : "Pending"}
                  </ThemedText>
                </View>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  contentLandscape: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
    width: "100%",
    maxWidth: 500,
  },
  heroCardLandscape: {
    maxWidth: 450,
  },
  heroBanner: {
    padding: Spacing.lg,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: PremiumColors.royalGold,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  codeSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  codeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: Spacing.xs,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: PremiumColors.royalGold,
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: PremiumColors.royalGold,
    letterSpacing: 2,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  linkSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  linkLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: Spacing.xs,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  shareButton: {
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    maxWidth: 500,
  },
  statsRowLandscape: {
    maxWidth: 450,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textAlign: "center",
  },
  rewardsCard: {
    padding: Spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    width: "100%",
    maxWidth: 500,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rewardsTextContainer: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NeonColors.green,
  },
  rewardsAmount: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  claimButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  claimButtonGradient: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  howItWorksCard: {
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 500,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PremiumColors.royalGold,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PremiumColors.royalGold,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a2e",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  recentCard: {
    padding: Spacing.md,
    width: "100%",
    maxWidth: 500,
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  referralAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  referralName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  referralDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  referralStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  referralStatusCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  referralStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  referralStatusTextCompleted: {
    color: NeonColors.green,
  },
});
