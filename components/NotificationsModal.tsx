import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useNotifications, AppNotification } from "@/contexts/NotificationsContext";
import {
  NeonColors,
  Spacing,
  BorderRadius,
  GlassColors,
  PremiumColors,
  GradientColors,
} from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getNotificationIcon(type: AppNotification["type"]): string {
  switch (type) {
    case "deposit":
      return "arrow-down-circle";
    case "withdrawal":
      return "arrow-up-circle";
    case "bonus":
      return "gift";
    case "spin":
      return "disc";
    case "update":
      return "download";
    case "checkin":
      return "calendar";
    case "system":
    default:
      return "bell";
  }
}

function getNotificationColor(type: AppNotification["type"], status?: string): string {
  if (status === "failed") return NeonColors.pink;
  if (status === "pending") return NeonColors.gold;
  
  switch (type) {
    case "deposit":
      return NeonColors.green;
    case "withdrawal":
      return NeonColors.pink;
    case "bonus":
      return NeonColors.purple;
    case "spin":
      return PremiumColors.royalGold;
    case "update":
      return NeonColors.blue;
    case "checkin":
      return NeonColors.gold;
    case "system":
    default:
      return NeonColors.purple;
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const iconName = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type, notification.status);
  
  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    
    if (notification.type === "update" && notification.data?.downloadUrl) {
      try {
        await Linking.openURL(notification.data.downloadUrl);
      } catch (error) {
        console.error("Failed to open download URL:", error);
      }
    }
  };
  
  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete(notification.id);
  };
  
  return (
    <AnimatedPressable
      entering={SlideInRight.duration(200)}
      onPress={handlePress}
      style={[
        styles.notificationItem,
        !notification.read && styles.notificationItemUnread,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={iconName as any} size={18} color={color} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <ThemedText style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </ThemedText>
          <ThemedText style={styles.notificationTime}>
            {formatTimeAgo(notification.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </ThemedText>
        {notification.amount ? (
          <View style={styles.amountBadge}>
            <ThemedText style={[styles.amountText, { color }]}>
              {notification.status === "failed" ? "-" : "+"}${notification.amount.toFixed(2)}
            </ThemedText>
          </View>
        ) : null}
      </View>
      
      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Feather name="x" size={16} color="rgba(255, 255, 255, 0.4)" />
      </Pressable>
      
      {!notification.read ? <View style={[styles.unreadDot, { backgroundColor: color }]} /> : null}
    </AnimatedPressable>
  );
}

export function NotificationsModal() {
  const {
    notifications,
    unreadCount,
    isModalVisible,
    hideModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();
  
  const handleMarkRead = (id: string) => {
    markAsRead(id);
  };
  
  const handleDelete = (id: string) => {
    deleteNotification(id);
  };
  
  const handleClearAll = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    clearAllNotifications();
  };
  
  const handleMarkAllRead = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markAllAsRead();
  };
  
  const renderItem = ({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onMarkRead={handleMarkRead}
      onDelete={handleDelete}
    />
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="bell-off" size={48} color="rgba(255, 255, 255, 0.2)" />
      <ThemedText style={styles.emptyTitle}>No Notifications</ThemedText>
      <ThemedText style={styles.emptyMessage}>
        You're all caught up! New alerts will appear here.
      </ThemedText>
    </View>
  );
  
  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={hideModal}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={hideModal} />
        
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={GradientColors.velvetNight}
            style={styles.modalGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Feather name="bell" size={22} color={PremiumColors.royalGold} />
                <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
                {unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <ThemedText style={styles.unreadBadgeText}>{unreadCount}</ThemedText>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.headerActions}>
                {notifications.length > 0 ? (
                  <>
                    {unreadCount > 0 ? (
                      <Pressable onPress={handleMarkAllRead} style={styles.headerButton}>
                        <Feather name="check-circle" size={18} color={NeonColors.green} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={handleClearAll} style={styles.headerButton}>
                      <Feather name="trash-2" size={18} color={NeonColors.pink} />
                    </Pressable>
                  </>
                ) : null}
                <Pressable onPress={hideModal} style={styles.closeButton}>
                  <Feather name="x" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
            
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  unreadBadge: {
    backgroundColor: NeonColors.pink,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    position: "relative",
  },
  notificationItemUnread: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    marginLeft: Spacing.sm,
  },
  notificationMessage: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 18,
  },
  amountBadge: {
    marginTop: 4,
  },
  amountText: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  emptyMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.3)",
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
