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
  LayoutAnimation,
  UIManager,
  Platform,
  Image,
  Modal,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import socket from "../api/socket";
import { ArrowLeftIcon, TrashIcon } from "../components/SvgIcons";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  reportId?: any;
  status: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    status?: string;
    resolutionEvidence?: string[];
    proofPhotos?: string[];
  };
}

const INITIAL_DISPLAY_COUNT = 5;

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
    case "rejected":
      return { color: "#DC2626", bg: "rgba(239, 68, 68, 0.1)", icon: "❌", label: "Rejected" };
    case "responding":
    case "active":
      return { color: "#0284C7", bg: "rgba(14, 165, 233, 0.1)", icon: "🚨", label: "Responding" };
    case "resolved":
    case "responded":
      return { color: "#2563EB", bg: "rgba(37, 99, 235, 0.1)", icon: "✅", label: "Scene Done" };
    case "closed":
      return { color: "#059669", bg: "rgba(16, 185, 129, 0.1)", icon: "📁", label: "Closed" };
    default:
      return { color: "#0A1E3F", bg: "rgba(10, 30, 63, 0.06)", icon: "📋", label: "Updated" };
  }
}

export default function NotificationsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res = await api.get("/notifications/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setNotifications(Array.isArray(data) ? data : data?.notifications ?? []);
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

  const handleDeleteAllNotifications = () => {
    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const token = await getToken();
              await api.delete("/notifications/delete-all", {
                headers: { Authorization: `Bearer ${token}` },
              });
              setNotifications([]);
              setExpanded(false);
              DeviceEventEmitter.emit("notificationsRead");
            } catch (error: any) {
              console.log("Failed to delete all notifications:", error.response?.data || error.message);
              Alert.alert("Error", "Failed to delete notifications. Please try again.");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  useEffect(() => {
    fetchNotifications();

    const sub = DeviceEventEmitter.addListener("reportStatusUpdated", () => {
      fetchNotifications();
    });

    const handleSocketNotification = () => {
      fetchNotifications();
    };
    socket.on("notification", handleSocketNotification);

    return () => {
      sub.remove();
      socket.off("notification", handleSocketNotification);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasMore = notifications.length > INITIAL_DISPLAY_COUNT;
  const displayedNotifications = expanded
    ? notifications
    : notifications.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = notifications.length - INITIAL_DISPLAY_COUNT;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Top Header Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.backButton}
        >
          <ArrowLeftIcon size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerTitleBar} />
        </View>
      </View>

      {/* ── Sub-header / Actions Toolbar ── */}
      <View style={styles.toolbar}>
        <View style={styles.unreadBadge}>
          <View
            style={[
              styles.unreadBadgeDot,
              { backgroundColor: unreadCount > 0 ? COLORS.accent : "#94A3B8" },
            ]}
          />
          <Text style={styles.unreadBadgeText}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          </Text>
        </View>

        <View style={styles.toolbarActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAllNotifications}
              activeOpacity={0.7}
              style={styles.deleteAllButton}
              disabled={deletingAll}
            >
              {deletingAll ? (
                <ActivityIndicator size="small" color={COLORS.red} />
              ) : (
                <>
                  <TrashIcon size={14} color={COLORS.red} />
                  <Text style={styles.deleteAllText}>Delete All</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content Area ── */}
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
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
        >
          {displayedNotifications.map((notif) => {
            const accent = getStatusAccent(notif.status);
            const isUnread = !notif.read;

            const resolutionEvidence: string[] =
              Array.isArray(notif.metadata?.resolutionEvidence) &&
              notif.metadata.resolutionEvidence.length > 0
                ? notif.metadata.resolutionEvidence
                : Array.isArray(notif.reportId?.resolutionEvidence)
                ? notif.reportId.resolutionEvidence
                : [];

            return (
              <TouchableOpacity
                key={notif._id}
                activeOpacity={0.85}
                onPress={() => {
                  if (isUnread) handleMarkOneRead(notif._id);
                }}
                style={[styles.card, isUnread && styles.cardUnread]}
              >
                {/* Left accent strip */}
                <View
                  style={[styles.accentStrip, { backgroundColor: accent.color }]}
                />

                <View style={styles.cardBody}>
                  {/* Top Header Row */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.statusIconCircle,
                        { backgroundColor: accent.bg },
                      ]}
                    >
                      <Text style={styles.statusIcon}>{accent.icon}</Text>
                    </View>

                    <View style={styles.cardTitleArea}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        {isUnread && (
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: accent.color },
                            ]}
                          />
                        )}
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: accent.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusPillText, { color: accent.color }]}
                        >
                          {accent.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardRightArea}>
                      <Text style={styles.timeText}>
                        {getRelativeTime(notif.createdAt)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(notif._id)}
                        style={styles.deleteCardButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <TrashIcon size={15} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Message Body */}
                  <Text style={styles.cardMessage}>{notif.message}</Text>

                  {/* Responder Resolution Evidence Photos */}
                  {resolutionEvidence.length > 0 && (
                    <View style={styles.evidenceContainer}>
                      <Text style={styles.evidenceTitle}>
                        📷 Responder Evidence ({resolutionEvidence.length})
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.evidenceScroll}
                      >
                        {resolutionEvidence.map((src, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setLightboxImage(src)}
                            activeOpacity={0.8}
                            style={styles.evidenceThumb}
                          >
                            <Image
                              source={{ uri: src }}
                              style={styles.evidenceImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Footer: Type Badge */}
                  <View style={styles.cardFooter}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {notif.type === "responder_assigned"
                          ? "Responder Assigned"
                          : "Status Update"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* ── See More / See Less Button ── */}
          {hasMore && (
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(
                    300,
                    LayoutAnimation.Types.easeInEaseOut,
                    LayoutAnimation.Properties.opacity
                  )
                );
                setExpanded((prev) => !prev);
              }}
              activeOpacity={0.7}
              style={styles.seeMoreButton}
            >
              <View style={styles.seeMoreInner}>
                <Text style={styles.seeMoreText}>
                  {expanded ? "See Less" : "See More"}
                </Text>
                {!expanded && (
                  <View style={styles.seeMoreBadge}>
                    <Text style={styles.seeMoreBadgeText}>{hiddenCount}</Text>
                  </View>
                )}
                <Text style={styles.seeMoreArrow}>
                  {expanded ? "▲" : "▼"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── LIGHTBOX MODAL FOR FULL SCREEN IMAGE VIEWING ── */}
      <Modal
        visible={!!lightboxImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxImage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLightboxImage(null)}
          style={styles.lightboxOverlay}
        >
          <TouchableOpacity
            onPress={() => setLightboxImage(null)}
            style={styles.lightboxCloseBtn}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
          {lightboxImage && (
            <Image
              source={{ uri: lightboxImage }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ── Header Bar ── */
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitleGroup: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerTitleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },

  /* ── Sub-header / Toolbar ── */
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 6,
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  unreadBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accent,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    gap: 4,
  },
  deleteAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.red,
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
    paddingHorizontal: 18,
    paddingTop: 4,
  },

  /* ── Card ── */
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: "#F0F7FF",
    borderColor: "rgba(59, 130, 246, 0.25)",
    shadowOpacity: 0.08,
    elevation: 3,
  },
  accentStrip: {
    width: 4.5,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 19,
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
    fontSize: 15.5,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardRightArea: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  deleteCardButton: {
    marginTop: 10,
    padding: 4,
  },
  cardMessage: {
    fontSize: 13.5,
    lineHeight: 21,
    color: "#334155",
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: "row",
    marginTop: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(10, 30, 63, 0.05)",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* ── Evidence Gallery ── */
  evidenceContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  evidenceTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  evidenceScroll: {
    flexDirection: "row",
  },
  evidenceThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    backgroundColor: "#1E293B",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
  },

  /* ── See More Button ── */
  seeMoreButton: {
    marginTop: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  seeMoreInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
  seeMoreBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  seeMoreBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accent,
  },
  seeMoreArrow: {
    fontSize: 10,
    color: COLORS.accent,
  },

  /* ── Lightbox Modal ── */
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: 48,
    right: 24,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  lightboxCloseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  lightboxImg: {
    width: "100%",
    height: "75%",
    borderRadius: 16,
  },
});
