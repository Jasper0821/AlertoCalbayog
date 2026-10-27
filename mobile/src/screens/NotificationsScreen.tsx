import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Ellipsis, Megaphone, Settings } from "lucide-react-native";
import socket from "../api/socket";
import {
  deleteNotification,
  fetchNotifications,
  markAllRead,
  markRead,
  markUnread,
  type NotificationItem,
  type ReportRef,
} from "../api/notifications";
import { fetchReport } from "../api/reports";
import SwipeToDelete from "../components/SwipeToDelete";
import { getEmergencyType } from "../constants/emergencyTypes";
import { REPORT_STATUS, reportStatus, type ReportStatusKey } from "../constants/reportStatus";
import { incidentId, relativeTime, unbroken } from "../utils/incident";
import { showDialog } from "../utils/dialog";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "Notifications">;
}

const UNDO_MS = 5000;
const UNREAD_BG = "#F4FAF7";
const UNREAD_BORDER = "#9FD0BC";
const FINISHED: ReportStatusKey[] = ["resolved", "closed"];
const MAX_THUMBS = 4;

interface HistoryEntry {
  key: string;
  status: ReportStatusKey;
  detail: string;
  at: string;
}

interface ReportGroup {
  kind: "report";
  key: string;
  reportId: string;
  report: ReportRef | null;
  items: NotificationItem[];
  status: ReportStatusKey;
  latestAt: string;
  unread: boolean;
  history: HistoryEntry[];
}

interface AdvisoryGroup {
  kind: "advisory";
  key: string;
  item: NotificationItem;
  latestAt: string;
  unread: boolean;
}

type Group = ReportGroup | AdvisoryGroup;

const reportIdOf = (n: NotificationItem): string | null => {
  if (n.reportId && typeof n.reportId === "object") return n.reportId._id;
  if (typeof n.reportId === "string" && n.reportId) return n.reportId;
  return n.metadata?.reportId || null;
};

const statusOf = (n: NotificationItem): ReportStatusKey => {
  const status = n.type === "responder_assigned" ? "assigned" : n.metadata?.status;
  return (status && status in REPORT_STATUS ? status : "pending") as ReportStatusKey;
};

const agencyOf = (report: ReportRef | null) =>
  report?.assignedAgency && report.assignedAgency !== "NONE" ? report.assignedAgency : "";

/** One line under each step in a card's history. */
function stepDetail(status: ReportStatusKey, item: NotificationItem | null, agency: string): string {
  switch (status) {
    case "pending":
      return "Dispatch has your location";
    case "assigned":
      return item?.message?.replace(/\.$/, "") || "A responder is handling your report";
    case "responding":
      return agency ? `${agency} team is heading to you` : "A team is heading to you";
    case "resolved":
      return "Responders finished at the scene";
    case "closed":
      return "Report closed";
    case "rejected":
      return "Not accepted by dispatch";
    case "cancelled":
      return "Withdrawn by you";
  }
}

const byNewest = (a: { at: string }, b: { at: string }) => +new Date(b.at) - +new Date(a.at);

/**
 * Folds every notification about the same report into one card showing the
 * report's current status, with the earlier steps as its history. Notifications
 * not tied to a report become advisory cards.
 */
function buildGroups(list: NotificationItem[]): Group[] {
  const groups: Group[] = [];
  const byReport = new Map<string, NotificationItem[]>();

  for (const n of list) {
    const id = reportIdOf(n);
    if (!id) {
      groups.push({ kind: "advisory", key: n._id, item: n, latestAt: n.createdAt, unread: !n.read });
      continue;
    }
    if (!byReport.has(id)) byReport.set(id, []);
    byReport.get(id)!.push(n);
  }

  for (const [reportId, unsorted] of byReport) {
    const items = [...unsorted].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const populated = items.find((i) => i.reportId && typeof i.reportId === "object");
    const report = (populated?.reportId as ReportRef | undefined) ?? null;
    const latest = items[0];

    // The report's own status is the truth; notifications can lag behind it.
    let status: ReportStatusKey =
      report?.status && report.status in REPORT_STATUS ? (report.status as ReportStatusKey) : statusOf(latest);
    if (status === "pending" && statusOf(latest) === "assigned") status = "assigned";

    // One entry per earlier step, newest first, excluding the step the card shows.
    const agency = agencyOf(report);
    const seen = new Set<ReportStatusKey>([status]);
    const history: HistoryEntry[] = [];
    for (const item of items) {
      const step = statusOf(item);
      if (seen.has(step)) continue;
      seen.add(step);
      history.push({ key: item._id, status: step, detail: stepDetail(step, item, agency), at: item.createdAt });
    }
    // Residents get no notification when they send, so "received" comes from the report.
    if (!seen.has("pending") && report?.createdAt) {
      history.push({ key: `${reportId}-received`, status: "pending", detail: stepDetail("pending", null, ""), at: report.createdAt });
    }
    history.sort(byNewest);

    groups.push({
      kind: "report",
      key: reportId,
      reportId,
      report,
      items,
      status,
      latestAt: latest.createdAt,
      unread: items.some((i) => !i.read),
      history,
    });
  }

  return groups.sort((a, b) => +new Date(b.latestAt) - +new Date(a.latestAt));
}

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();


export default function NotificationsScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [evidence, setEvidence] = useState<Record<string, string[]>>({});
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState(false);
  const [menuFor, setMenuFor] = useState<Group | null>(null);

  const mounted = useRef(true);
  const evidenceRequested = useRef(new Set<string>());
  const pendingDelete = useRef<{ key: string; ids: string[]; timer: ReturnType<typeof setTimeout> | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchNotifications();
      if (mounted.current) setNotifications(list);
    } catch (error: any) {
      console.log("Failed to fetch notifications:", error?.response?.data || error?.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("reportStatusUpdated", load);
    socket.on("notification", load);
    return () => {
      sub.remove();
      socket.off("notification", load);
    };
  }, [load]);

  /** Sends a pending delete to the server now. Only notifications are removed — never the report. */
  const commitDelete = useCallback(async (entry: { key: string; ids: string[] }) => {
    try {
      await Promise.all(entry.ids.map(deleteNotification));
      if (mounted.current) setNotifications((prev) => prev.filter((n) => !entry.ids.includes(n._id)));
    } catch {
      if (mounted.current) {
        showDialog("Not deleted", "The notification could not be deleted. Check your connection and try again.");
      }
    } finally {
      if (mounted.current) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(entry.key);
          return next;
        });
      }
      DeviceEventEmitter.emit("notificationsRead");
    }
  }, []);

  // Leaving the screen inside the undo window still completes the delete.
  useEffect(
    () => () => {
      mounted.current = false;
      const entry = pendingDelete.current;
      if (entry) {
        if (entry.timer) clearTimeout(entry.timer);
        commitDelete(entry);
      }
    },
    [commitDelete]
  );

  const groups = useMemo(() => buildGroups(notifications), [notifications]);

  // Resolution photos live on the report, not the notification: fetch them once per finished report.
  useEffect(() => {
    const needed = groups
      .filter((g): g is ReportGroup => g.kind === "report" && FINISHED.includes(g.status))
      .map((g) => g.reportId)
      .filter((id) => !evidenceRequested.current.has(id));
    if (needed.length === 0) return;
    needed.forEach((id) => evidenceRequested.current.add(id));
    (async () => {
      for (const id of needed) {
        try {
          const report = await fetchReport(id);
          const photos = Array.isArray(report?.resolutionEvidence) ? report.resolutionEvidence : [];
          if (mounted.current) setEvidence((prev) => ({ ...prev, [id]: photos }));
        } catch {
          evidenceRequested.current.delete(id); // Retry on the next refresh.
        }
      }
    })();
  }, [groups]);

  const visible = groups.filter((g) => !hidden.has(g.key) && (filter === "all" || g.unread));
  const unreadCount = groups.filter((g) => !hidden.has(g.key) && g.unread).length;
  const sections = [
    { title: "Today", items: visible.filter((g) => isToday(g.latestAt)) },
    { title: "Earlier", items: visible.filter((g) => !isToday(g.latestAt)) },
  ].filter((s) => s.items.length > 0);

  const setRead = (ids: string[], read: boolean) =>
    setNotifications((prev) => prev.map((n) => (ids.includes(n._id) ? { ...n, read } : n)));

  const markGroupRead = (group: Group) => {
    const ids =
      group.kind === "report"
        ? group.items.filter((i) => !i.read).map((i) => i._id)
        : group.item.read
        ? []
        : [group.item._id];
    if (ids.length === 0) return;
    setRead(ids, true);
    Promise.all(ids.map(markRead))
      .catch(() => {})
      .finally(() => DeviceEventEmitter.emit("notificationsRead"));
  };

  const markGroupUnread = (group: Group) => {
    const id = group.kind === "report" ? group.items[0]._id : group.item._id;
    setRead([id], false);
    markUnread(id)
      .catch(() => {})
      .finally(() => DeviceEventEmitter.emit("notificationsRead"));
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllRead();
    } catch {
      load();
    } finally {
      DeviceEventEmitter.emit("notificationsRead");
    }
  };

  /** Hides the card at once and deletes after the undo window. */
  const requestDelete = (group: Group) => {
    const previous = pendingDelete.current;
    if (previous) {
      if (previous.timer) clearTimeout(previous.timer);
      commitDelete(previous);
    }
    const entry: { key: string; ids: string[]; timer: ReturnType<typeof setTimeout> | null } = {
      key: group.key,
      ids: group.kind === "report" ? group.items.map((i) => i._id) : [group.item._id],
      timer: null,
    };
    entry.timer = setTimeout(() => {
      if (pendingDelete.current === entry) pendingDelete.current = null;
      if (mounted.current) setSnackbar(false);
      commitDelete(entry);
    }, UNDO_MS);
    pendingDelete.current = entry;
    setHidden((prev) => new Set(prev).add(group.key));
    setSnackbar(true);
  };

  const undoDelete = () => {
    const entry = pendingDelete.current;
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    pendingDelete.current = null;
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(entry.key);
      return next;
    });
    setSnackbar(false);
  };

  const toggleHistory = (group: ReportGroup) => {
    markGroupRead(group);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group.key)) next.delete(group.key);
      else next.add(group.key);
      return next;
    });
  };

  const openReport = (group: ReportGroup) => {
    markGroupRead(group);
    if (FINISHED.includes(group.status)) {
      navigation.navigate("ResolutionReport", { reportId: group.reportId });
    } else {
      navigation.navigate("AlertSent", {
        reportId: group.reportId,
        emergencyType: group.report?.emergencyType || "others",
        reportStatus: group.status === "assigned" ? "pending" : group.status,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderReport = (group: ReportGroup) => {
    const meta = reportStatus(group.status);
    const Icon = meta.Icon;
    const type = getEmergencyType(group.report?.emergencyType);
    const typeName = type.label.replace(/ emergency$/, "");
    const photos = evidence[group.reportId] || [];
    const agency = agencyOf(group.report);
    const finished = FINISHED.includes(group.status);
    const isOpen = expanded.has(group.key);
    const latest = group.items[0];
    const body =
      group.status === "responding" && agency
        ? `${agency} responders are heading to your location. Keep your phone nearby.`
        : group.status === "resolved" && photos.length === 0
        ? "Responders finished at the scene."
        : // The server's message for a rejection carries the dispatcher's reason.
        group.status === "rejected" && statusOf(latest) === "rejected" && latest.message
        ? latest.message
        : meta.body;
    const extra = photos.length - MAX_THUMBS;

    return (
      <SwipeToDelete key={group.key} onDelete={() => requestDelete(group)}>
        <View style={[styles.card, group.unread && styles.cardUnread]}>
          <View style={styles.cardTop}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openReport(group)}
              accessibilityRole="button"
              accessibilityLabel={`${group.unread ? "Unread. " : ""}${meta.title}. ${typeName}, report ${incidentId(group.reportId, group.report?.createdAt)}. ${relativeTime(group.latestAt)}`}
              accessibilityHint={finished ? "Opens the resolution report" : "Opens the live status"}
              style={styles.cardMain}
            >
              <View style={[styles.statusIcon, { backgroundColor: meta.bg }]}>
                <Icon size={22} color={meta.color} strokeWidth={2} />
              </View>
              <View style={styles.cardHeading}>
                <Text style={styles.cardTitle}>
                  {meta.title}
                  {group.unread && <Text style={styles.unreadMark}>{"  ●"}</Text>}
                </Text>
                <Text style={styles.cardMeta}>
                  {typeName} · Report #{unbroken(incidentId(group.reportId, group.report?.createdAt))}
                </Text>
              </View>
              <Text style={styles.time}>{relativeTime(group.latestAt)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMenuFor(group)}
              accessibilityRole="button"
              accessibilityLabel="More options"
              style={styles.moreButton}
            >
              <Ellipsis size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.body}>{body}</Text>

          {finished && photos.length > 0 && (
            <>
              <View style={styles.thumbRow}>
                {photos.slice(0, MAX_THUMBS).map((uri, index) => {
                  const showMore = index === MAX_THUMBS - 1 && extra > 0;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      key={`${index}-${uri.slice(-16)}`}
                      onPress={() => openReport(group)}
                      accessibilityRole="button"
                      accessibilityLabel={showMore ? `${extra} more responder photos` : `Responder photo ${index + 1}`}
                      style={styles.thumb}
                    >
                      <Image source={{ uri }} style={styles.thumbImage} />
                      {showMore && (
                        <View style={styles.thumbMore}>
                          <Text style={styles.thumbMoreText}>+{extra}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openReport(group)}
                accessibilityRole="button"
                style={styles.evidenceButton}
              >
                <Text style={styles.evidenceButtonText}>View resolution evidence</Text>
                <ChevronRight size={18} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {group.history.length > 0 && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleHistory(group)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={styles.historyToggle}
              >
                <Text style={styles.historyToggleText}>
                  {isOpen
                    ? "Hide earlier updates"
                    : `Show ${group.history.length} earlier update${group.history.length === 1 ? "" : "s"}`}
                </Text>
                <ChevronDown
                  size={18}
                  color={colors.badgeText}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                />
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.history}>
                  {group.history.map((entry) => {
                    const step = REPORT_STATUS[entry.status];
                    return (
                      <View key={entry.key} style={styles.historyItem}>
                        <View style={[styles.historyDot, { backgroundColor: step.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>{step.step}</Text>
                          <Text style={styles.historyDetail} numberOfLines={1}>
                            {entry.detail}
                          </Text>
                        </View>
                        <Text style={styles.historyTime}>{relativeTime(entry.at)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </SwipeToDelete>
    );
  };

  const renderAdvisory = (group: AdvisoryGroup) => (
    <SwipeToDelete key={group.key} onDelete={() => requestDelete(group)}>
      <View style={[styles.card, group.unread && styles.cardUnread]}>
        <View style={styles.cardTop}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => markGroupRead(group)}
            accessibilityRole="button"
            accessibilityLabel={`${group.unread ? "Unread. " : ""}${group.item.title || "CDRRMO advisory"}. ${group.item.message}`}
            style={styles.cardMain}
          >
            <View style={[styles.statusIcon, { backgroundColor: "#E3EEF9" }]}>
              <Megaphone size={22} color="#1F5FA0" strokeWidth={2} />
            </View>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>
                {group.item.title || "CDRRMO advisory"}
                {group.unread && <Text style={styles.unreadMark}>{"  ●"}</Text>}
              </Text>
              <Text style={styles.cardMeta}>{relativeTime(group.latestAt)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMenuFor(group)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={styles.moreButton}
          >
            <Ellipsis size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <Text style={styles.body}>{group.item.message}</Text>
      </View>
    </SwipeToDelete>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Home")}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            style={styles.iconButton}
          >
            <ChevronLeft size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Notifications
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Settings")}
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
            style={styles.iconButton}
          >
            <Settings size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          {(["all", "unread"] as const).map((key) => {
            const selected = filter === key;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={key}
                onPress={() => setFilter(key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                  {key === "all" ? "All" : `Unread · ${unreadCount}`}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ flex: 1 }} />
          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              style={styles.markAll}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.medical} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.medical} />}
        >
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Check size={28} color={colors.medical} strokeWidth={2.4} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptyText}>Updates on your reports will appear here.</Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionLabel} accessibilityRole="header">
                  {section.title}
                </Text>
                {section.items.map((group) => (group.kind === "report" ? renderReport(group) : renderAdvisory(group)))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {snackbar && (
        <View style={[styles.snackbar, { bottom: insets.bottom + spacing.lg }]} accessibilityLiveRegion="polite">
          <Text style={styles.snackbarText}>Notification deleted</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={undoDelete} accessibilityRole="button" style={styles.undo}>
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* More options */}
      <Modal visible={menuFor !== null} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuFor(null)} accessibilityLabel="Close menu">
          <View style={[styles.menu, { paddingBottom: insets.bottom + spacing.md }]}>
            {menuFor && (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const group = menuFor;
                    setMenuFor(null);
                    if (group.unread) markGroupRead(group);
                    else markGroupUnread(group);
                  }}
                  accessibilityRole="button"
                  style={styles.menuItem}
                >
                  <Text style={styles.menuText}>{menuFor.unread ? "Mark as read" : "Mark as unread"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const group = menuFor;
                    setMenuFor(null);
                    requestDelete(group);
                  }}
                  accessibilityRole="button"
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuText, { color: colors.destructive }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMenuFor(null)}
                  accessibilityRole="button"
                  style={[styles.menuItem, styles.menuCancel]}
                >
                  <Text style={styles.menuText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: spacing.xs,
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.text,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  pillTextSelected: {
    color: colors.white,
  },
  markAll: {
    minHeight: 44,
    justifyContent: "center",
  },
  markAllText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.medical,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardUnread: {
    backgroundColor: UNREAD_BG,
    borderColor: UNREAD_BORDER,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeading: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  // Inline so it stays beside the last word when the title wraps. The card's
  // accessibility label already starts with "Unread".
  unreadMark: {
    fontSize: fontSize.sm,
    color: colors.urgent,
  },
  cardMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    paddingTop: 2,
  },
  moreButton: {
    width: 44,
    height: 44,
    marginTop: -10,
    marginRight: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 21,
    color: colors.text,
  },
  thumbRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbMore: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(21,32,27,0.6)",
  },
  thumbMoreText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.white,
  },
  evidenceButton: {
    minHeight: 48,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.medical,
  },
  evidenceButtonText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  historyToggle: {
    minHeight: 44,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyToggleText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.badgeText,
  },
  history: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  historyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  historyDetail: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  historyTime: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.badgeBg,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
  },
  snackbar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  snackbarText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  undo: {
    minHeight: 44,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  undoText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: "#9FD0BC",
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  menu: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.white,
  },
  menuItem: {
    minHeight: 52,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuCancel: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
});
