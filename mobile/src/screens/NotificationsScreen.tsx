import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  DeviceEventEmitter,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, TrashIcon } from "../components/SvgIcons";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  reportId: string;
  status: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusAccent(status: string): { color: string; bg: string; icon: string; label: string } {
  switch (status?.toLowerCase()) {
    case "verified":
      return { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.08)", icon: "✓", label: "Verified" };
    case "responding":
    case "active":
      return { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.08)", icon: "🚨", label: "Responding" };
    case "resolved":
    case "responded":
      return { color: "#10B981", bg: "rgba(16, 185, 129, 0.08)", icon: "✅", label: "Resolved" };
    case "closed":
      return { color: "#5F6368", bg: "rgba(95, 99, 104, 0.08)", icon: "📁", label: "Closed" };
    default:
      return { color: "#0A1E3F", bg: "rgba(10, 30, 63, 0.05)", icon: "📋", label: "Updated" };
  }
}

export default function NotificationsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res = await api.get("/notifications/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error: any) {
      console.log("Failed to fetch notifications:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();
      await api.put("/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      // Broadcast so the Header badge updates
      DeviceEventEmitter.emit("notificationsRead");
    } catch (error: any) {
      console.log("Failed to mark all as read:", error.response?.data || error.message);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const token = await getToken();
      await api.put(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      DeviceEventEmitter.emit("notificationsRead");
    } catch (error: any) {
      console.log("Failed to mark as read:", error.response?.data || error.message);
    }
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await api.delete(`/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setNotifications((prev) => prev.filter((n) => n._id !== id));
              DeviceEventEmitter.emit("notificationsRead");
            } catch (error: any) {
              console.log("Failed to delete notification:", error.response?.data || error.message);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchNotifications();

    const sub = DeviceEventEmitter.addListener("reportStatusUpdated", () => {
      fetchNotifications();
    });

    return () => {
      sub.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.backButton}
          >
            <ArrowLeftIcon size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} unread
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You'll be notified here when responders{"\n"}take action on your reports.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
        >
          {notifications.map((notif) => {
            const accent = getStatusAccent(notif.status);
            const isUnread = !notif.read;

            return (
              <TouchableOpacity
                key={notif._id}
                activeOpacity={0.8}
                onPress={() => {
                  if (isUnread) handleMarkOneRead(notif._id);
                }}
                style={[
                  styles.card,
                  isUnread && styles.cardUnread,
                ]}
              >
                {/* Left accent strip */}
                <View style={[styles.accentStrip, { backgroundColor: accent.color }]} />

                <View style={styles.cardBody}>
                  {/* Top row: icon + title + time/delete */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.statusIconCircle, { backgroundColor: accent.bg }]}>
                      <Text style={styles.statusIcon}>{accent.icon}</Text>
                    </View>
                    <View style={styles.cardTitleArea}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{notif.title}</Text>
                        {isUnread && <View style={[styles.unreadDot, { backgroundColor: accent.color }]} />}
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: accent.bg }]}>
                        <Text style={[styles.statusPillText, { color: accent.color }]}>{accent.label}</Text>
                      </View>
                    </View>
                    <View style={styles.cardRightArea}>
                      <Text style={styles.timeText}>{getRelativeTime(notif.createdAt)}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(notif._id)}
                        style={styles.deleteCardButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <TrashIcon size={14} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Message */}
                  <Text style={styles.cardMessage} numberOfLines={3}>
                    {notif.message}
                  </Text>

                  {/* Bottom: type badge */}
                  <View style={styles.cardFooter}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {notif.type === "responder_assigned" ? "Responder Assigned" : "Status Update"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent,
    marginTop: 1,
  },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },

  /* ── Empty State ── */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 21,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  /* ── Card ── */
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: "#FAFBFF",
    borderColor: "rgba(59, 130, 246, 0.15)",
    shadowOpacity: 0.08,
    elevation: 2,
  },
  accentStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 18,
  },
  cardTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  cardFooter: {
    flexDirection: "row",
    marginTop: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(10, 30, 63, 0.04)",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardRightArea: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  deleteCardButton: {
    marginTop: 8,
    padding: 4,
  },
});
