import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Inbox,
  MapPin,
  Shield,
  Siren,
  TriangleAlert,
  UserCheck,
  type LucideIcon,
} from "lucide-react-native";
import socket from "../api/socket";
import { cancelReport, fetchMyReports, removeFromHistory } from "../api/reports";
import { fetchUnreadCount } from "../api/notifications";
import { HOTLINES } from "../components/EmergencyHotlineSheet";
import { getEmergencyType } from "../constants/emergencyTypes";
import { incidentId, unbroken } from "../utils/incident";
import { showDialog } from "../utils/dialog";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReportHistory">;
}

type Filter = "all" | "active" | "closed";
type Stage = 1 | 2 | 3 | 4;

const UNDO_MS = 5000;
const REFRESH_MS = 20 * 1000;
const STATUS_BG = "#F4FAF7";
const STATUS_BORDER = "#BFE0D1";
const STEP_LABELS = ["Received", "Assigned", "On the way", "Done"];
// Agency that leads each type, used before an agency takes the report.
const LEAD_AGENCY: Record<string, string> = { fire: "BFP", crime: "PNP" };

/** Still needs the resident: in progress, or finished but not yet confirmed. */
const needsAttention = (r: any) =>
  ["pending", "responding"].includes(r.status) || (r.status === "resolved" && !r.residentConfirmedAt);

const stageOf = (r: any): Stage =>
  r.status === "resolved" ? 4 : r.status === "responding" ? 3 : r.assignedResponder ? 2 : 1;

const agencyOf = (r: any): string =>
  (r.assignedAgency && r.assignedAgency !== "NONE" && r.assignedAgency) ||
  LEAD_AGENCY[(r.emergencyType || "").toLowerCase()] ||
  r.notifiedAgencies?.[0] ||
  "CDRRMO";

const STAGES: Record<Stage, { status: (agency: string) => string; next: string; Icon: LucideIcon }> = {
  1: {
    status: (agency) => `${agency} received your report`,
    next: "Keep your phone nearby. We'll update you here.",
    Icon: Inbox,
  },
  2: {
    status: () => "A responder has been assigned",
    next: "Stay where you are. Responders will head out soon.",
    Icon: UserCheck,
  },
  3: {
    status: () => "Responders are on the way",
    next: "Send someone to meet responders at the road or landmark.",
    Icon: Siren,
  },
  4: {
    status: () => "Responders finished at the scene",
    next: "Check the evidence and tell us if you're okay.",
    Icon: Check,
  },
};

const closedLabel = (r: any) =>
  r.status === "cancelled" ? "Cancelled" : r.status === "rejected" ? "Not accepted" : "Resolved";

const formatWhen = (value: string) => {
  const d = new Date(value);
  return {
    date: d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }),
  };
};

const addressOf = (r: any): string => {
  const loc = r.location || {};
  if (loc.name) return loc.name;
  const parts = [loc.street, loc.purok, loc.barangay ? `Brgy. ${loc.barangay}` : "", "Calbayog, Samar"];
  return parts.filter(Boolean).join(", ");
};

/** Real steps from the report's own log, oldest first. */
function timelineOf(r: any): { key: string; title: string; detail: string; at: string }[] {
  const steps = [{ key: "sent", title: "Report sent", detail: "Your location was shared", at: r.createdAt }];
  (r.actionLog || []).forEach((entry: any, index: number) => {
    const agency = entry.actorAgency || "";
    let title = "";
    let detail = "";
    if (entry.action === "resident_confirmed") {
      title = "You confirmed it's resolved";
    } else if (entry.action === "cancelled_by_reporter") {
      title = "You cancelled the report";
    } else if (entry.action === "responder_assignment") {
      title = "Responder assigned";
      detail = (entry.message || "").replace(/^Assigned\s+/i, "");
    } else if (entry.action === "auto_close") {
      title = "Report closed";
      detail = "Closed automatically";
    } else if (entry.toStatus === "responding") {
      title = "Responders on the way";
      detail = agency;
    } else if (entry.toStatus === "resolved") {
      title = "Finished at the scene";
      detail = agency;
    } else if (entry.toStatus === "closed") {
      title = "Report closed";
    } else if (entry.toStatus === "rejected") {
      title = "Not accepted by dispatch";
      detail = agency;
    }
    if (title) steps.push({ key: `log-${index}`, title, detail, at: entry.createdAt });
  });
  return steps.sort((a, b) => +new Date(a.at) - +new Date(b.at));
}

export default function ReportHistoryScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [unread, setUnread] = useState(0);
  const [openTimelines, setOpenTimelines] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<any | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState(false);

  const mounted = useRef(true);
  const pendingRemove = useRef<{ id: string; timer: ReturnType<typeof setTimeout> | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchMyReports();
      if (mounted.current) setReports(list);
    } catch (error: any) {
      console.log("Failed to fetch reports:", error?.response?.data || error?.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const loadUnread = useCallback(() => {
    fetchUnreadCount()
      .then((count) => mounted.current && setUnread(count))
      .catch(() => {});
  }, []);

  const hasActive = reports.some(needsAttention);

  // Live while the screen is open: socket events, plus a slow poll as a backstop.
  useFocusEffect(
    useCallback(() => {
      load();
      loadUnread();
      if (!hasActive) return;
      const timer = setInterval(load, REFRESH_MS);
      return () => clearInterval(timer);
    }, [load, loadUnread, hasActive])
  );

  useEffect(() => {
    const onChange = () => {
      load();
      loadUnread();
    };
    const statusSub = DeviceEventEmitter.addListener("reportStatusUpdated", onChange);
    const readSub = DeviceEventEmitter.addListener("notificationsRead", loadUnread);
    socket.on("notification", onChange);
    return () => {
      statusSub.remove();
      readSub.remove();
      socket.off("notification", onChange);
    };
  }, [load, loadUnread]);

  const commitRemove = useCallback(async (id: string) => {
    try {
      await removeFromHistory(id);
      if (mounted.current) setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (error: any) {
      if (mounted.current) {
        showDialog("Not removed", error?.response?.data?.message || "Please check your connection and try again.");
      }
    } finally {
      if (mounted.current) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  }, []);

  // Leaving within the undo window still completes the removal.
  useEffect(
    () => () => {
      mounted.current = false;
      const entry = pendingRemove.current;
      if (entry) {
        if (entry.timer) clearTimeout(entry.timer);
        commitRemove(entry.id);
      }
    },
    [commitRemove]
  );

  const requestRemove = (report: any) => {
    const previous = pendingRemove.current;
    if (previous) {
      if (previous.timer) clearTimeout(previous.timer);
      commitRemove(previous.id);
    }
    const entry: { id: string; timer: ReturnType<typeof setTimeout> | null } = { id: report._id, timer: null };
    entry.timer = setTimeout(() => {
      if (pendingRemove.current === entry) pendingRemove.current = null;
      if (mounted.current) setSnackbar(false);
      commitRemove(entry.id);
    }, UNDO_MS);
    pendingRemove.current = entry;
    setHidden((prev) => new Set(prev).add(report._id));
    setSnackbar(true);
  };

  const undoRemove = () => {
    const entry = pendingRemove.current;
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    pendingRemove.current = null;
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(entry.id);
      return next;
    });
    setSnackbar(false);
  };

  const requestCancel = (report: any) => {
    // Once responders are moving, cancelling from the phone could recall a team on
    // the road, so the server refuses it; send the resident to the hotline instead.
    if (report.status !== "pending") {
      const agency = agencyOf(report);
      const line = HOTLINES.find((h) => h.agency.startsWith(agency));
      showDialog("Call to cancel", `Responders are already handling this report. Call ${agency} to cancel it.`, [
        { text: "Not now", style: "cancel" },
        { text: `Call ${agency}`, onPress: () => Linking.openURL(`tel:${line?.dialNumber || "911"}`) },
      ]);
      return;
    }
    showDialog("Cancel this report?", "Responders will stop.", [
      { text: "Keep report", style: "cancel" },
      {
        text: "Cancel report",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelReport(report._id);
            load();
          } catch (error: any) {
            showDialog("Not cancelled", error?.response?.data?.message || "Please try again, or call the hotline.");
            load();
          }
        },
      },
    ]);
  };

  const shareReport = (report: any) => {
    const type = getEmergencyType(report.emergencyType);
    const status = needsAttention(report) ? STAGES[stageOf(report)].status(agencyOf(report)) : closedLabel(report);
    const { date, time } = formatWhen(report.createdAt);
    Share.share({
      message: [
        `Alerto Calbayog report #${incidentId(report._id, report.createdAt)}`,
        `${type.label} · ${status}`,
        addressOf(report),
        `Reported ${date}, ${time}`,
      ].join("\n"),
    }).catch(() => {});
  };

  const toggleTimeline = (id: string) =>
    setOpenTimelines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), Promise.resolve(loadUnread())]);
    setRefreshing(false);
  };

  const visible = reports.filter((r) => !hidden.has(r._id));
  const byNewest = (a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt);
  const active = visible.filter(needsAttention).sort(byNewest);
  const closed = visible.filter((r) => !needsAttention(r)).sort(byNewest);
  const showActive = filter !== "closed" && active.length > 0;
  const showClosed = filter !== "active" && closed.length > 0;

  const renderActive = (report: any) => {
    const type = getEmergencyType(report.emergencyType);
    const TypeIcon = type.Icon;
    const stage = stageOf(report);
    const copy = STAGES[stage];
    const StageIcon = copy.Icon;
    const agency = agencyOf(report);
    const { date, time } = formatWhen(report.createdAt);
    const responder = report.assignedResponder?.fullName;
    const handled =
      report.assignedAgency && report.assignedAgency !== "NONE"
        ? `Handled by ${report.assignedAgency}${responder ? ` · ${responder}` : ""}`
        : `Sent to ${(report.notifiedAgencies?.length ? report.notifiedAgencies : [agency]).join(" & ")}`;
    const timelineOpen = openTimelines.has(report._id);

    return (
      <View key={report._id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
            <TypeIcon size={22} color={colors.white} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.typeName}>{type.label}</Text>
            <Text style={styles.meta}>
              {date} · {time} · #{unbroken(incidentId(report._id, report.createdAt))}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMenuFor(report)}
            accessibilityRole="button"
            accessibilityLabel="More options for this report"
            style={styles.moreButton}
          >
            <Ellipsis size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.statusRow} accessibilityLiveRegion="polite">
            <StageIcon size={20} color={colors.badgeText} strokeWidth={2} />
            <Text style={styles.statusText}>{copy.status(agency)}</Text>
          </View>
          <View
            style={styles.progress}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${stage} of 4: ${STEP_LABELS[stage - 1].toLowerCase()}`}
            accessibilityValue={{ min: 1, max: 4, now: stage }}
          >
            {STEP_LABELS.map((label, index) => (
              <View key={label} style={styles.progressStep}>
                <View style={[styles.segment, index < stage && styles.segmentFilled]} />
                <Text style={[styles.stepLabel, index < stage && styles.stepLabelDone]}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.nextStep}>{copy.next}</Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MapPin size={18} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.detailText}>{addressOf(report)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Shield size={18} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.detailText}>{handled}</Text>
          </View>
        </View>

        {stage === 4 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ResolutionReport", { reportId: report._id })}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.medical }]}
          >
            <Text style={styles.primaryText}>View evidence & confirm</Text>
            <ChevronRight size={18} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("AlertSent", {
                reportId: report._id,
                emergencyType: report.emergencyType,
                reportStatus: report.status,
              })
            }
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
          >
            <Text style={styles.primaryText}>Track live</Text>
            <ChevronRight size={18} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleTimeline(report._id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: timelineOpen }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>{timelineOpen ? "Hide timeline" : "See full timeline"}</Text>
        </TouchableOpacity>

        {timelineOpen && (
          <View style={styles.timeline}>
            {timelineOf(report).map((step) => {
              const when = formatWhen(step.at);
              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                    {step.detail ? <Text style={styles.timelineDetail}>{step.detail}</Text> : null}
                  </View>
                  <Text style={styles.timelineTime}>
                    {when.date}, {when.time}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderClosed = (report: any) => {
    const type = getEmergencyType(report.emergencyType);
    const TypeIcon = type.Icon;
    const name = type.label.replace(/ emergency$/, "");
    const { date } = formatWhen(report.createdAt);
    const place = report.location?.barangay ? `Brgy. ${report.location.barangay}` : "Calbayog";
    const label = closedLabel(report);

    return (
      <View key={report._id} style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ResolutionReport", { reportId: report._id })}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${label}. ${date}, ${place}. Opens the resolution report`}
          style={styles.rowMain}
        >
          <View style={styles.rowIcon}>
            <TypeIcon size={20} color={colors.textSecondary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowTitleLine}>
              <Text style={styles.rowTitle}>{name}</Text>
              <View style={styles.pillGray}>
                <Text style={styles.pillGrayText}>{label}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {date} · {place}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMenuFor(report)}
          accessibilityRole="button"
          accessibilityLabel="More options for this report"
          style={styles.moreButton}
        >
          <Ellipsis size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  const counts: Record<Filter, number> = { all: visible.length, active: active.length, closed: closed.length };
  const menuIsActive = menuFor ? needsAttention(menuFor) : false;

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
            My reports
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Notifications")}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            style={styles.iconButton}
          >
            <Bell size={22} color={colors.text} strokeWidth={2} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["all", "active", "closed"] as Filter[]).map((key) => {
            const selected = filter === key;
            const label = key === "all" ? "All" : key === "active" ? "Active" : "Closed";
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
                  {label} · {counts[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.medical} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.medical} />}
        >
          {!showActive && !showClosed ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No reports here</Text>
              <Text style={styles.emptyText}>Reports you send will appear in this list.</Text>
            </View>
          ) : (
            <>
              {showActive && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel} accessibilityRole="header">
                    Needs your attention
                  </Text>
                  {active.map(renderActive)}
                </View>
              )}
              {showClosed && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel} accessibilityRole="header">
                    Closed
                  </Text>
                  {closed.map(renderClosed)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {snackbar && (
        <View style={[styles.snackbar, { bottom: insets.bottom + 52 + spacing.lg * 2 }]} accessibilityLiveRegion="polite">
          <Text style={styles.snackbarText}>Removed from your list</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={undoRemove} accessibilityRole="button" style={styles.undo}>
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pinned: a new emergency is always one tap away */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("ChooseEmergencyType")}
          accessibilityRole="button"
          style={styles.sendButton}
        >
          <TriangleAlert size={20} color={colors.white} strokeWidth={2} />
          <Text style={styles.sendText}>Send a new report</Text>
        </TouchableOpacity>
      </View>

      {/* More options */}
      <Modal visible={menuFor !== null} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuFor(null)} accessibilityLabel="Close menu">
          <View style={[styles.menu, { paddingBottom: insets.bottom + spacing.md }]}>
            {menuFor && menuIsActive && menuFor.status !== "resolved" && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const report = menuFor;
                  setMenuFor(null);
                  requestCancel(report);
                }}
                accessibilityRole="button"
                style={styles.menuItem}
              >
                <Text style={[styles.menuText, { color: colors.destructive }]}>Cancel report</Text>
              </TouchableOpacity>
            )}
            {menuFor && menuIsActive && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const report = menuFor;
                  setMenuFor(null);
                  shareReport(report);
                }}
                accessibilityRole="button"
                style={styles.menuItem}
              >
                <Text style={styles.menuText}>Share report</Text>
              </TouchableOpacity>
            )}
            {menuFor && !menuIsActive && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const report = menuFor;
                  setMenuFor(null);
                  requestRemove(report);
                }}
                accessibilityRole="button"
                style={styles.menuItem}
              >
                <Text style={[styles.menuText, { color: colors.destructive }]}>Remove from history</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMenuFor(null)}
              accessibilityRole="button"
              style={[styles.menuItem, styles.menuLast]}
            >
              <Text style={styles.menuText}>Close</Text>
            </TouchableOpacity>
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
  badge: {
    position: "absolute",
    top: 5,
    right: 3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.urgent,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    color: colors.white,
  },
  filterRow: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
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
    gap: 14,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  typeName: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  moreButton: {
    width: 44,
    height: 44,
    marginTop: -8,
    marginRight: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBox: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: STATUS_BORDER,
    backgroundColor: STATUS_BG,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusText: {
    flex: 1,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.badgeText,
  },
  progress: {
    flexDirection: "row",
    gap: 4,
  },
  progressStep: {
    flex: 1,
    gap: 4,
  },
  segment: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  segmentFilled: {
    backgroundColor: colors.medical,
  },
  stepLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepLabelDone: {
    color: colors.badgeText,
  },
  nextStep: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    lineHeight: 19,
    color: colors.text,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: radius.md,
  },
  primaryText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: -6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  secondaryText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  timeline: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: colors.medical,
  },
  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  timelineDetail: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  timelineTime: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EDEB",
  },
  rowTitleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  pillGray: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "#E9EDEB",
  },
  pillGrayText: {
    fontFamily: fonts.bold,
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.urgent,
  },
  sendText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.white,
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
  menuLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
});
