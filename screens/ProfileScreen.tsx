import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, useWindowDimensions, FlatList, ActivityIndicator, Platform, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, getGameActivity, updateUserProfile, Transaction, GameActivity } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors, PremiumColors, createBoxShadow } from "@/constants/theme";

const PROFILE_AVATARS: { [key: string]: any } = {
  dragon: require("@/attached_assets/generated_images/golden_dragon_profile_avatar.png"),
  phoenix: require("@/attached_assets/generated_images/royal_phoenix_profile_avatar.png"),
  tiger: require("@/attached_assets/generated_images/noble_tiger_profile_avatar.png"),
  cat: require("@/attached_assets/generated_images/lucky_cat_profile_avatar.png"),
  wolf: require("@/attached_assets/generated_images/mysterious_wolf_profile_avatar.png"),
  owl: require("@/attached_assets/generated_images/wise_owl_profile_avatar.png"),
};

const AVATAR_STORAGE_KEY = "@jade_royale_avatar";

interface MostPlayedGame {
  gameName: string;
  playCount: number;
  totalBet: number;
  totalWin: number;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = "details" | "transactions" | "mostPlayed" | "avatar";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user, token, logout } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mostPlayedGames, setMostPlayedGames] = useState<MostPlayedGame[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const isLandscape = screenWidth > screenHeight;

  useEffect(() => {
    loadSavedAvatar();
    if (token) {
      loadData();
    }
  }, [token]);

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

  const loadData = async () => {
    if (!token) return;
    setIsLoadingData(true);
    try {
      const [transResult, activityResult] = await Promise.all([
        getTransactions(token),
        getGameActivity(token),
      ]);
      if (transResult.success && transResult.data) {
        setTransactions(transResult.data);
      }
      console.log("[Profile] Activity result:", activityResult.success, activityResult.error);
      if (activityResult.success && activityResult.data) {
        const responseData = activityResult.data as any;
        console.log("[Profile] Raw game activity response:", JSON.stringify(responseData, null, 2));
        const activityData = responseData.data || responseData;
        let activity: GameActivity[] = [];
        
        if (Array.isArray(activityData)) {
          activity = activityData;
        } else if (Array.isArray(activityData.activity)) {
          activity = activityData.activity;
        } else if (Array.isArray(activityData.data?.activity)) {
          activity = activityData.data.activity;
        } else if (Array.isArray(activityData.games)) {
          activity = activityData.games;
        } else if (Array.isArray(activityData.data)) {
          activity = activityData.data;
        } else if (typeof activityData === 'object') {
          const keys = Object.keys(activityData);
          console.log("[Profile] Activity data keys:", keys);
          for (const key of keys) {
            if (Array.isArray(activityData[key])) {
              console.log("[Profile] Found array at key:", key, "length:", activityData[key].length);
              activity = activityData[key];
              break;
            }
          }
        }
        
        console.log("[Profile] Game activity loaded:", activity.length, "records");
        
        if (Array.isArray(activity) && activity.length > 0) {
          console.log("[Profile] First activity item:", JSON.stringify(activity[0], null, 2));
          const gameMap = new Map<string, MostPlayedGame>();
          
          activity.forEach((item: GameActivity) => {
            const itemAny = item as any;
            const gameName = item.game || itemAny.game_name || itemAny.name || itemAny.title || itemAny.game_title || itemAny.slot || itemAny.game_id || "Unknown";
            const existing = gameMap.get(gameName);
            const betAmount = parseFloat(item.bet || itemAny.total_bet || itemAny.bet_amount || itemAny.amount || "0");
            const winAmount = parseFloat(item.win || itemAny.total_win || itemAny.win_amount || itemAny.payout || "0");
            
            if (existing) {
              existing.playCount += 1;
              existing.totalBet += betAmount;
              existing.totalWin += winAmount;
            } else {
              gameMap.set(gameName, {
                gameName,
                playCount: 1,
                totalBet: betAmount,
                totalWin: winAmount,
              });
            }
          });
          
          const sorted = Array.from(gameMap.values())
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 10);
          setMostPlayedGames(sorted);
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      setIsLoggingOut(true);
      await logout();
      setIsLoggingOut(false);
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) {
        await doLogout();
      }
    } else {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: doLogout,
          },
        ]
      );
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAvatarId(avatarId);
    try {
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    } catch (error) {
      console.error("Error saving avatar:", error);
    }
  };

  const handleEditEmail = () => {
    setEmailInput(user?.email || "");
    setIsEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    if (!token || !emailInput.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      if (Platform.OS === "web") {
        alert("Please enter a valid email address");
      } else {
        Alert.alert("Invalid Email", "Please enter a valid email address");
      }
      return;
    }
    
    setIsSavingEmail(true);
    try {
      const result = await updateUserProfile(token, { email: emailInput.trim() });
      if (result.success) {
        if (Platform.OS === "web") {
          alert("Email updated successfully!");
        } else {
          Alert.alert("Success", "Email updated successfully!");
        }
        setIsEditingEmail(false);
      } else {
        if (Platform.OS === "web") {
          alert(result.error || "Failed to update email");
        } else {
          Alert.alert("Error", result.error || "Failed to update email");
        }
      }
    } catch (error) {
      console.error("Error updating email:", error);
      if (Platform.OS === "web") {
        alert("Failed to update email");
      } else {
        Alert.alert("Error", "Failed to update email");
      }
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCancelEmailEdit = () => {
    setIsEditingEmail(false);
    setEmailInput("");
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "details", label: "Details", icon: "user" },
    { id: "transactions", label: "Transactions", icon: "credit-card" },
    { id: "mostPlayed", label: "Top Games", icon: "play-circle" },
    { id: "avatar", label: "Avatar", icon: "image" },
  ];

  const renderTab = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.id;
    return (
      <Pressable
        key={tab.id}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setActiveTab(tab.id);
        }}
        style={[styles.tab, isActive && styles.tabActive]}
      >
        <Feather 
          name={tab.icon as any} 
          size={14} 
          color={isActive ? NeonColors.gold : "rgba(255, 255, 255, 0.5)"} 
        />
        <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </ThemedText>
      </Pressable>
    );
  };

  const renderDetailsTab = () => (
    <View style={styles.tabContentRow}>
      <View style={styles.detailsList}>
        <View style={styles.detailRowCompact}>
          <Feather name="hash" size={14} color={NeonColors.purple} />
          <ThemedText style={styles.detailLabelCompact}>Player ID:</ThemedText>
          <ThemedText style={styles.detailValueCompact}>{user?.user_id || user?.id || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRowCompact}>
          <Feather name="home" size={14} color={NeonColors.gold} />
          <ThemedText style={styles.detailLabelCompact}>Shop ID:</ThemedText>
          <ThemedText style={styles.detailValueCompact}>{user?.shop_id || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRowCompact}>
          <Feather name="user" size={14} color={NeonColors.blue} />
          <ThemedText style={styles.detailLabelCompact}>Username:</ThemedText>
          <ThemedText style={styles.detailValueCompact}>{user?.username || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRowCompact}>
          <Feather name="mail" size={14} color={NeonColors.green} />
          <ThemedText style={styles.detailLabelCompact}>Email:</ThemedText>
          {isEditingEmail ? (
            <View style={styles.emailEditContainer}>
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter email"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={handleSaveEmail} disabled={isSavingEmail} style={styles.emailActionBtn}>
                {isSavingEmail ? (
                  <ActivityIndicator size="small" color={NeonColors.green} />
                ) : (
                  <Feather name="check" size={14} color={NeonColors.green} />
                )}
              </Pressable>
              <Pressable onPress={handleCancelEmailEdit} style={styles.emailActionBtn}>
                <Feather name="x" size={14} color={NeonColors.pink} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.emailDisplayContainer}>
              <ThemedText style={styles.detailValueCompact} numberOfLines={1}>
                {user?.email || "Not set"}
              </ThemedText>
              <Pressable onPress={handleEditEmail} style={styles.emailEditBtn}>
                <Feather name="edit-2" size={12} color={NeonColors.gold} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <View style={styles.balanceBox}>
        <ThemedText style={styles.balanceLabelSmall}>Balance</ThemedText>
        <ThemedText style={styles.balanceAmountSmall}>
          ${(user?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </ThemedText>
      </View>
    </View>
  );

  const getTransactionIcon = (type: string): string => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes("deposit") || typeLower.includes("credit")) return "arrow-down-circle";
    if (typeLower.includes("withdraw") || typeLower.includes("debit")) return "arrow-up-circle";
    if (typeLower.includes("win") || typeLower.includes("bonus") || typeLower.includes("jackpot")) return "award";
    if (typeLower.includes("bet") || typeLower.includes("loss") || typeLower.includes("play")) return "play-circle";
    return "activity";
  };

  const getTransactionColor = (type: string, sum: number): string => {
    const typeLower = type.toLowerCase();
    if (sum > 0 || typeLower.includes("deposit") || typeLower.includes("credit") || typeLower.includes("win") || typeLower.includes("bonus") || typeLower.includes("jackpot")) {
      return NeonColors.green;
    }
    return NeonColors.pink;
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const sumValue = parseFloat(item.sum || "0");
    const isPositive = sumValue > 0 || item.type.toLowerCase().includes("deposit") || 
                       item.type.toLowerCase().includes("credit") || 
                       item.type.toLowerCase().includes("win") ||
                       item.type.toLowerCase().includes("bonus");
    const amount = Math.abs(sumValue);
    const color = getTransactionColor(item.type, sumValue);
    const iconName = getTransactionIcon(item.type);
    
    return (
      <View style={styles.transactionItemCompact}>
        <View style={[styles.transactionIconContainer, { backgroundColor: `${color}20` }]}>
          <Feather name={iconName as any} size={12} color={color} />
        </View>
        <View style={styles.transactionDetails}>
          <ThemedText style={styles.transactionTypeCompact} numberOfLines={1}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </ThemedText>
          {item.title ? (
            <ThemedText style={styles.transactionTitleCompact} numberOfLines={1}>
              {item.title}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText style={[styles.transactionAmountCompact, { color }]}>
          {isPositive ? "+" : "-"}${amount.toFixed(2)}
        </ThemedText>
      </View>
    );
  };

  const renderTransactionsTab = () => (
    <View style={styles.tabContentFull}>
      {isLoadingData ? (
        <ActivityIndicator size="small" color={NeonColors.purple} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainerCompact}>
          <Feather name="credit-card" size={24} color="rgba(255, 255, 255, 0.3)" />
          <ThemedText style={styles.emptyTextCompact}>No transactions yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={transactions.slice(0, 15)}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderTransactionItem}
          showsVerticalScrollIndicator={false}
          style={styles.transactionsList}
        />
      )}
    </View>
  );

  const renderMostPlayedItem = ({ item, index }: { item: MostPlayedGame; index: number }) => {
    const profit = item.totalWin - item.totalBet;
    const profitColor = profit >= 0 ? NeonColors.green : NeonColors.pink;
    
    return (
      <View style={styles.mostPlayedItem}>
        <View style={styles.mostPlayedRank}>
          <ThemedText style={styles.mostPlayedRankText}>#{index + 1}</ThemedText>
        </View>
        <View style={styles.mostPlayedDetails}>
          <ThemedText style={styles.mostPlayedGameName} numberOfLines={1}>
            {item.gameName}
          </ThemedText>
          <ThemedText style={styles.mostPlayedPlays}>
            {item.playCount} plays
          </ThemedText>
        </View>
        <View style={styles.mostPlayedStats}>
          <ThemedText style={[styles.mostPlayedProfit, { color: profitColor }]}>
            {profit >= 0 ? "+" : ""}${profit.toFixed(0)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderMostPlayedTab = () => (
    <View style={styles.tabContentFull}>
      {isLoadingData ? (
        <ActivityIndicator size="small" color={NeonColors.purple} />
      ) : mostPlayedGames.length === 0 ? (
        <View style={styles.emptyContainerCompact}>
          <Feather name="play-circle" size={24} color="rgba(255, 255, 255, 0.3)" />
          <ThemedText style={styles.emptyTextCompact}>No games played yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={mostPlayedGames}
          keyExtractor={(item, index) => `${item.gameName}-${index}`}
          renderItem={renderMostPlayedItem}
          showsVerticalScrollIndicator={false}
          style={styles.transactionsList}
        />
      )}
    </View>
  );

  const renderAvatarTab = () => (
    <View style={styles.avatarGridCompact}>
      {Object.entries(PROFILE_AVATARS).map(([id, source]) => {
        const isSelected = selectedAvatarId === id;
        return (
          <Pressable
            key={id}
            onPress={() => handleAvatarSelect(id)}
            style={[styles.avatarOptionCompact, isSelected && styles.avatarOptionSelected]}
          >
            <Image source={source} style={styles.avatarImageCompact} contentFit="cover" />
            {isSelected ? (
              <View style={styles.avatarCheckmarkCompact}>
                <Feather name="check" size={10} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return renderDetailsTab();
      case "transactions":
        return renderTransactionsTab();
      case "mostPlayed":
        return renderMostPlayedTab();
      case "avatar":
        return renderAvatarTab();
      default:
        return null;
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
        isLandscape ? styles.containerLandscape : styles.containerPortrait, 
        { 
          paddingTop: insets.top + (isLandscape ? 8 : 16),
          paddingBottom: insets.bottom + (isLandscape ? 8 : 16),
          paddingLeft: insets.left + (isLandscape ? 12 : 16),
          paddingRight: insets.right + (isLandscape ? 12 : 16),
        }
      ]}>
        {isLandscape ? (
          <>
            <View style={styles.leftPanel}>
              <View style={styles.headerRow}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="x" size={20} color="#FFFFFF" />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Profile</ThemedText>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.avatarContainerSmall}>
                  {selectedAvatarId && PROFILE_AVATARS[selectedAvatarId] ? (
                    <Image 
                      source={PROFILE_AVATARS[selectedAvatarId]} 
                      style={styles.profileAvatarSmall} 
                      contentFit="cover" 
                    />
                  ) : (
                    <Feather name="user" size={24} color={NeonColors.green} />
                  )}
                </View>
                <ThemedText style={styles.usernameSmall}>{user?.username || "Player"}</ThemedText>
                <ThemedText style={styles.userIdSmall}>Player ID: {user?.user_id || user?.id || "N/A"}</ThemedText>
              </View>

              <NeonButton
                onPress={handleLogout}
                loading={isLoggingOut}
                color={NeonColors.pink}
                variant="outline"
                style={styles.logoutButtonSmall}
              >
                Logout
              </NeonButton>
            </View>

            <View style={styles.rightPanel}>
              <View style={styles.tabsRow}>
                {tabs.map(renderTab)}
              </View>

              <View style={styles.contentArea}>
                {renderTabContent()}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.portraitHeader}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.backButtonPortrait, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>
              <ThemedText style={styles.headerTitlePortrait}>Profile</ThemedText>
              <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView 
              style={styles.portraitScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.portraitContent}
            >
              <View style={styles.portraitProfileCard}>
                <View style={styles.avatarContainerLarge}>
                  {selectedAvatarId && PROFILE_AVATARS[selectedAvatarId] ? (
                    <Image 
                      source={PROFILE_AVATARS[selectedAvatarId]} 
                      style={styles.profileAvatarLarge} 
                      contentFit="cover" 
                    />
                  ) : (
                    <Feather name="user" size={48} color={NeonColors.green} />
                  )}
                </View>
                <ThemedText style={styles.usernameLarge}>{user?.username || "Player"}</ThemedText>
                <ThemedText style={styles.userIdLarge}>Player ID: {user?.user_id || user?.id || "N/A"}</ThemedText>
                
                <View style={styles.balanceContainer}>
                  <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
                  <ThemedText style={styles.balanceAmount}>
                    ${(user?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.portraitTabsContainer}>
                <View style={styles.portraitTabsRow}>
                  {tabs.map(renderTab)}
                </View>

                <View style={styles.portraitContentArea}>
                  {renderTabContent()}
                </View>
              </View>

              <View style={styles.portraitActions}>
                <NeonButton
                  onPress={handleLogout}
                  loading={isLoggingOut}
                  color={NeonColors.pink}
                  variant="outline"
                  style={styles.logoutButtonPortrait}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </NeonButton>
              </View>
            </ScrollView>
          </>
        )}
      </View>
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
  containerLandscape: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  containerPortrait: {
    flex: 1,
  },
  leftPanel: {
    width: 140,
    gap: 10,
  },
  rightPanel: {
    flex: 1,
    gap: 8,
  },
  portraitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButtonPortrait: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitlePortrait: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 44,
  },
  portraitScrollView: {
    flex: 1,
  },
  portraitContent: {
    paddingBottom: 24,
    gap: 24,
  },
  portraitProfileCard: {
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...createBoxShadow("#000", 0, 8, 0.3, 16, 8),
  },
  avatarContainerLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 3,
    borderColor: PremiumColors.royalGold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...createBoxShadow(PremiumColors.royalGold, 0, 0, 0.5, 12, 6),
  },
  profileAvatarLarge: {
    width: "100%",
    height: "100%",
  },
  usernameLarge: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  userIdLarge: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  balanceContainer: {
    marginTop: 16,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: BorderRadius.md,
    padding: 16,
    alignItems: "center",
    minWidth: 200,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: NeonColors.gold,
  },
  portraitTabsContainer: {
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  portraitTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  portraitContentArea: {
    minHeight: 200,
  },
  portraitActions: {
    gap: 16,
  },
  referralButtonPortrait: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: BorderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    gap: 12,
  },
  referralButtonTextPortrait: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: PremiumColors.royalGold,
  },
  logoutButtonPortrait: {
    height: 52,
    borderRadius: BorderRadius.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileCard: {
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  avatarContainerSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: PremiumColors.royalGold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarSmall: {
    width: "100%",
    height: "100%",
  },
  usernameSmall: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  userIdSmall: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
  logoutButtonSmall: {
    height: 36,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.sm,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 4,
    borderRadius: BorderRadius.xs,
  },
  tabActive: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  tabLabelActive: {
    color: NeonColors.gold,
  },
  contentArea: {
    flex: 1,
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.md,
    padding: 10,
  },
  tabContentRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  tabContentFull: {
    flex: 1,
  },
  detailsList: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  detailRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabelCompact: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    width: 70,
  },
  detailValueCompact: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  emailEditContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emailInput: {
    flex: 1,
    height: 28,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    paddingHorizontal: 8,
    fontSize: 11,
    color: "#FFFFFF",
  },
  emailActionBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
  },
  emailDisplayContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emailEditBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: 4,
  },
  balanceBox: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  balanceLabelSmall: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
  },
  balanceAmountSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: NeonColors.gold,
  },
  emptyContainerCompact: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTextCompact: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  transactionsList: {
    flex: 1,
  },
  transactionItemCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  transactionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTypeCompact: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  transactionTitleCompact: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
  transactionAmountCompact: {
    fontSize: 12,
    fontWeight: "700",
  },
  mostPlayedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mostPlayedRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  mostPlayedRankText: {
    fontSize: 10,
    fontWeight: "700",
    color: NeonColors.gold,
  },
  mostPlayedDetails: {
    flex: 1,
  },
  mostPlayedGameName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mostPlayedPlays: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
  mostPlayedStats: {
    alignItems: "flex-end",
  },
  mostPlayedProfit: {
    fontSize: 12,
    fontWeight: "700",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: BorderRadius.sm,
    padding: 8,
  },
  statValueCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabelCompact: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
  avatarGridCompact: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOptionCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarOptionSelected: {
    borderColor: NeonColors.gold,
    borderWidth: 3,
  },
  avatarImageCompact: {
    width: "100%",
    height: "100%",
  },
  avatarCheckmarkCompact: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: NeonColors.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  referralButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    gap: 6,
  },
  referralButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: PremiumColors.royalGold,
  },
});
