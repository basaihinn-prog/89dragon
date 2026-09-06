import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, getJackpots, Transaction, Jackpot } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, GradientColors, GlassColors } from "@/constants/theme";

type TabType = "transactions" | "jackpots";

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [transResult, jackpotResult] = await Promise.all([
        getTransactions(token),
        getJackpots(token),
      ]);

      if (transResult.success && transResult.data) {
        const data = Array.isArray(transResult.data) ? transResult.data : [];
        setTransactions(data);
      }

      if (jackpotResult.success && jackpotResult.data) {
        setJackpots(jackpotResult.data);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error("Error loading transaction data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number | string): string => {
    const numAmount = Number(amount) || 0;
    const prefix = numAmount >= 0 ? "+" : "";
    return `${prefix}$${Math.abs(numAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTransactionIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case "deposit":
      case "credit":
        return "arrow-down-circle";
      case "withdraw":
      case "debit":
        return "arrow-up-circle";
      case "win":
      case "jackpot":
        return "award";
      case "bet":
      case "play":
        return "play-circle";
      default:
        return "activity";
    }
  };

  const getTransactionColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case "deposit":
      case "credit":
      case "win":
      case "jackpot":
      case "bonus":
      case "reward":
        return NeonColors.green;
      case "withdraw":
      case "debit":
      case "bet":
      case "loss":
        return NeonColors.pink;
      case "refund":
      case "adjustment":
        return NeonColors.yellow;
      default:
        return NeonColors.blue;
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const amount = parseFloat(item.sum) || 0;
    const isPositive = item.type.toLowerCase() === "deposit" || 
                       item.type.toLowerCase() === "credit" || 
                       item.type.toLowerCase() === "win";
    
    return (
      <Card style={styles.transactionCard}>
        <View style={styles.transactionRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${getTransactionColor(item.type)}20` }]}>
            <Feather
              name={getTransactionIcon(item.type) as any}
              size={20}
              color={getTransactionColor(item.type)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <ThemedText style={styles.transactionType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </ThemedText>
            <ThemedText style={styles.transactionDate}>
              {formatDate(item.created_at)}
            </ThemedText>
            {item.title ? (
              <ThemedText style={styles.transactionDesc} numberOfLines={1}>
                {item.title}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.amountContainer}>
            <ThemedText
              style={[
                styles.transactionAmount,
                { color: isPositive ? NeonColors.green : NeonColors.pink },
              ]}
            >
              {formatAmount(isPositive ? amount : -amount)}
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  };

  const renderJackpotItem = ({ item }: { item: Jackpot }) => {
    const amount = parseFloat(item.sum) || 0;
    
    return (
      <Card style={styles.jackpotCard}>
        <View style={styles.jackpotHeader}>
          <Feather name="award" size={24} color={NeonColors.gold} />
          <ThemedText style={styles.jackpotName}>{item.name}</ThemedText>
        </View>
        <ThemedText style={styles.jackpotAmount}>
          ${amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </ThemedText>
        {item.game ? (
          <ThemedText style={styles.jackpotGame}>{item.game}</ThemedText>
        ) : null}
        {item.date_time ? (
          <ThemedText style={styles.jackpotDate}>
            Won: {formatDate(item.date_time)}
          </ThemedText>
        ) : null}
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather
        name={activeTab === "transactions" ? "credit-card" : "award"}
        size={48}
        color="rgba(255, 255, 255, 0.3)"
      />
      <ThemedText style={styles.emptyText}>
        {activeTab === "transactions"
          ? "No transactions yet"
          : "No jackpots available"}
      </ThemedText>
    </View>
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
        <ThemedText style={styles.headerTitle}>History</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={[
        styles.tabContainer, 
        { 
          marginLeft: insets.left + Spacing.lg, 
          marginRight: insets.right + Spacing.lg,
        },
        isLandscape && styles.tabContainerLandscape
      ]}>
        <Pressable
          onPress={() => setActiveTab("transactions")}
          style={[
            styles.tab,
            activeTab === "transactions" && styles.activeTab,
          ]}
        >
          <Feather
            name="credit-card"
            size={18}
            color={activeTab === "transactions" ? NeonColors.green : "rgba(255, 255, 255, 0.5)"}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "transactions" && styles.activeTabText,
            ]}
          >
            Transactions
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("jackpots")}
          style={[
            styles.tab,
            activeTab === "jackpots" && styles.activeTab,
          ]}
        >
          <Feather
            name="award"
            size={18}
            color={activeTab === "jackpots" ? NeonColors.gold : "rgba(255, 255, 255, 0.5)"}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "jackpots" && styles.activeTabText,
            ]}
          >
            Jackpots
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NeonColors.green} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={NeonColors.pink} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={loadData} style={styles.retryButton}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : activeTab === "transactions" ? (
        <FlatList
          key={isLandscape ? "landscape-trans" : "portrait-trans"}
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isLandscape ? 2 : 1}
          contentContainerStyle={[
            styles.listContent,
            { 
              paddingBottom: insets.bottom + Spacing.xl,
              paddingLeft: insets.left + Spacing.lg,
              paddingRight: insets.right + Spacing.lg,
            },
          ]}
          columnWrapperStyle={isLandscape ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={NeonColors.green}
            />
          }
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key={isLandscape ? "landscape-jack" : "portrait-jack"}
          data={jackpots}
          renderItem={renderJackpotItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isLandscape ? 2 : 1}
          contentContainerStyle={[
            styles.listContent,
            { 
              paddingBottom: insets.bottom + Spacing.xl,
              paddingLeft: insets.left + Spacing.lg,
              paddingRight: insets.right + Spacing.lg,
            },
          ]}
          columnWrapperStyle={isLandscape ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={NeonColors.green}
            />
          }
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: GlassColors.cardGlass,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tabContainerLandscape: {
    maxWidth: 400,
    alignSelf: "center",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  activeTab: {
    backgroundColor: GlassColors.darkGlass,
  },
  tabText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorText: {
    color: NeonColors.pink,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: NeonColors.purple,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: Spacing.lg,
  },
  transactionCard: {
    marginBottom: Spacing.md,
    flex: 1,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  transactionDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  transactionDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  jackpotCard: {
    marginBottom: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    flex: 1,
  },
  jackpotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  jackpotName: {
    fontSize: 18,
    fontWeight: "700",
    color: NeonColors.gold,
  },
  jackpotAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  jackpotGame: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: Spacing.xs,
  },
  jackpotDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: Spacing.xs,
  },
});
