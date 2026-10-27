import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, DeviceEventEmitter, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { Camera, Check, ChevronLeft, Phone, X } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import StatusTimeline, { type TimelineStep } from "../components/StatusTimeline";
import { HOTLINES } from "../components/EmergencyHotlineSheet";
import { getEmergencyType } from "../constants/emergencyTypes";
import { addPhotos, cancelReport, fetchReport, fetchReportSummary } from "../api/reports";
import { showDialog } from "../utils/dialog";
import { uploadEvidenceImage } from "../api/uploads";
import api from "../api/axios";
import socket, { connectSocket } from "../api/socket";
import { getToken } from "../utils/Storage";
import { captureScenePhoto, ensureCameraPermission } from "../utils/capturePhoto";
import { incidentId } from "../utils/incident";
import { card, cardTitle, colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  route: RouteProp<RootStackParamList, "AlertSent">;
  navigation: NativeStackNavigationProp<RootStackParamList, "AlertSent">;
}

const MAX_PHOTOS = 5;
const ACTIVE = ["pending", "responding"];
// How often to re-check status while help is on the way, in case the socket dropped.
const STATUS_POLL_MS = 15 * 1000;

// Agency that leads each type, for the hotline fallback before a responder is assigned.
const LEAD_AGENCY: Record<string, string> = { fire: "BFP", crime: "PNP" };

const STATUS_LINE: Record<string, string> = {
  pending: "Dispatch has your report. A responder is being assigned now.",
  responding: "Help is on the way.",
  resolved: "Responders have handled the scene.",
  closed: "This report is closed. Thank you for reporting.",
  rejected: "Dispatch could not accept this report. Call the hotline if you still need help.",
  cancelled: "You cancelled this report.",
};

function buildSteps(status: string, agencyLabel: string): TimelineStep[] {
  const rank = status === "pending" ? 1 : status === "responding" ? 2 : ["resolved", "closed"].includes(status) ? 4 : 1;
  const state = (index: number): TimelineStep["state"] =>
    index < rank ? "done" : index === rank && ACTIVE.includes(status) ? "current" : "upcoming";
  return [
    { key: "received", label: "Report received", detail: "Dispatch has your location", state: state(0) },
    {
      key: "assigned",
      label: "Responder assigned",
      detail: rank > 1 ? agencyLabel : rank === 1 && ACTIVE.includes(status) ? "Assigning a team…" : "Waiting",
      state: state(1),
    },
    {
      key: "en_route",
      label: "On the way",
      detail: rank > 2 ? "Responders reached you" : rank === 2 ? "Heading to your location" : "Waiting",
      state: state(2),
    },
    {
      key: "arrived",
      label: "Arrived",
      detail: rank > 3 ? "Responders are done on scene" : "Waiting",
      state: state(3),
    },
  ];
}

export default function AlertSentScreen({ route, navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { reportId, emergencyType } = route.params;
  const type = getEmergencyType(emergencyType);

  const [report, setReport] = useState<any>(null);
  const [status, setStatus] = useState<string>(route.params.reportStatus || "pending");
  const [busy, setBusy] = useState<"photos" | "cancel" | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const load = useCallback(async () => {
    try {
      const full = await fetchReport(reportId);
      setReport(full);
      if (full?.status) setStatus(full.status);
    } catch {
      // Keep showing the last known state; live updates still arrive by socket.
    }
  }, [reportId]);

  /**
   * Single entry point for status changes, whichever channel delivers them first:
   * the socket, the notification relay, the tracking ping or the poll below.
   * Reaching a finished state reloads the full report for the responder's photos.
   */
  const statusRef = useRef(status);
  statusRef.current = status;
  const applyStatus = useCallback(
    (next?: string) => {
      if (!next || next === statusRef.current) return;
      statusRef.current = next;
      setStatus(next);
      if (["resolved", "closed"].includes(next)) load();
    },
    [load]
  );

  // Socket payloads and summaries carry no photos, so keep the ones already loaded.
  const mergeReport = useCallback((updated: any) => {
    setReport((prev: any) => ({
      ...prev,
      ...updated,
      proofPhotos: prev?.proofPhotos ?? [],
      resolutionEvidence: prev?.resolutionEvidence ?? [],
    }));
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const summary = await fetchReportSummary(reportId);
      if (!summary) return;
      mergeReport(summary);
      applyStatus(summary.status);
    } catch {
      // Offline: the next poll or socket event catches up.
    }
  }, [reportId, mergeReport, applyStatus]);

  useEffect(() => {
    load();
    connectSocket();

    const onUpdate = (updated: any) => {
      if (!updated) return;
      mergeReport(updated);
      applyStatus(updated.status);
    };
    socket.on(`statusUpdate-${reportId}`, onUpdate);

    const sub = DeviceEventEmitter.addListener("reportStatusUpdated", (notif) => {
      if (notif.reportId === reportId) applyStatus(notif.status || notif.metadata?.status);
    });

    // Back from the background: the socket may have missed updates while asleep.
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        connectSocket();
        refreshStatus();
      }
    });

    return () => {
      socket.off(`statusUpdate-${reportId}`, onUpdate);
      sub.remove();
      appState.remove();
    };
  }, [reportId, load, mergeReport, applyStatus, refreshStatus]);

  const active = ACTIVE.includes(status);

  // Backstop for a dropped socket. The tracking ping below also returns the status,
  // but only fires when the phone moves, so a resident standing still needs this.
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(refreshStatus, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [active, refreshStatus]);

  // Share the resident's position with dispatch while help is still coming.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      const { status: permission } = await Location.getForegroundPermissionsAsync();
      if (permission !== "granted" || cancelled) return;
      const token = await getToken();
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (fix) => {
          api
            .post(
              "/tracking/update",
              { reportId, latitude: fix.coords.latitude, longitude: fix.coords.longitude, role: "resident" },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            // The reply carries the report's current status: keep the screen in step.
            .then((res) => applyStatus(res.data?.status))
            .catch(() => {});
        }
      ).catch(() => null);
      if (cancelled) subscription?.remove();
      else watchRef.current = subscription;
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [active, reportId, applyStatus]);

  const peopleCount: number = report?.peopleCount ?? route.params.peopleCount ?? 1;
  const proofPhotos: string[] = Array.isArray(report?.proofPhotos) ? report.proofPhotos : [];
  const resolutionPhotos: string[] = Array.isArray(report?.resolutionEvidence) ? report.resolutionEvidence : [];

  const agency =
    (report?.assignedAgency && report.assignedAgency !== "NONE" && report.assignedAgency) ||
    report?.assignedResponder?.agency ||
    LEAD_AGENCY[(emergencyType || "").toLowerCase()] ||
    "CDRRMO";
  const responder = report?.assignedResponder;
  const agencyLabel = [agency, responder?.fullName].filter(Boolean).join(" · ");
  const hotline = HOTLINES.find((h) => h.agency.startsWith(agency));
  const callNumber: string = responder?.phoneNumber || hotline?.dialNumber || "911";
  const callLabel = responder?.phoneNumber ? "Call responder" : `Call ${agency}`;

  const failed = status === "rejected" || status === "cancelled";
  const headerColor = status === "rejected" ? colors.destructive : status === "cancelled" ? colors.textSecondary : colors.medical;
  const headline = status === "rejected" ? "Report not accepted" : status === "cancelled" ? "Report cancelled" : "Alert sent";

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"));

  const handleAddPhotos = async () => {
    if (busy || proofPhotos.length >= MAX_PHOTOS) return;
    if (!(await ensureCameraPermission())) return;
    try {
      const uri = await captureScenePhoto();
      if (!uri) return;
      setBusy("photos");
      const hosted = await uploadEvidenceImage(uri, "proof");
      const updated = await addPhotos(reportId, [hosted]);
      setReport((prev: any) => ({ ...prev, proofPhotos: updated?.proofPhotos ?? [...proofPhotos, hosted] }));
    } catch (error: any) {
      showDialog("Photo not added", error.response?.data?.message || "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = () => {
    showDialog("Cancel this report?", "Only cancel if help is no longer needed. Responders will stop preparing.", [
      { text: "Keep report", style: "cancel" },
      {
        text: "Cancel report",
        style: "destructive",
        onPress: async () => {
          setBusy("cancel");
          try {
            const updated = await cancelReport(reportId);
            setStatus("cancelled");
            setReport((prev: any) => ({ ...prev, ...updated, proofPhotos: prev?.proofPhotos ?? [] }));
          } catch (error: any) {
            showDialog("Not cancelled", error.response?.data?.message || "Please try again, or call the hotline.");
            load();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerTop}>
            <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
              <ChevronLeft size={26} color={colors.white} />
            </Pressable>
            <Text style={styles.reportId}>Report #{incidentId(reportId, report?.createdAt)}</Text>
          </View>
          <View style={styles.headline}>
            <View style={styles.checkCircle}>
              {failed ? (
                <X size={26} color={headerColor} strokeWidth={3} />
              ) : (
                <Check size={26} color={headerColor} strokeWidth={3} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headlineText}>{headline}</Text>
              <Text style={styles.headlineSub}>
                {type.label} · {peopleCount} {peopleCount === 1 ? "person" : "people"}
              </Text>
            </View>
          </View>
          <View style={styles.statusLine}>
            <Text style={styles.statusLineText} accessibilityLiveRegion="polite">
              {status === "rejected" && report?.rejectionReason
                ? `Dispatch could not accept this report: ${report.rejectionReason}. Call the hotline if you still need help.`
                : STATUS_LINE[status] || STATUS_LINE.pending}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {!failed && (
            <View style={card}>
              <Text style={[cardTitle, styles.cardTitleSpacing]}>Status</Text>
              <StatusTimeline steps={buildSteps(status, agencyLabel)} />
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${callNumber}`)}
              accessibilityRole="button"
              accessibilityLabel={`${callLabel}, ${callNumber}`}
              style={styles.callButton}
            >
              <Phone size={19} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.callText}>{callLabel}</Text>
            </TouchableOpacity>
            {active && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddPhotos}
                disabled={busy !== null || proofPhotos.length >= MAX_PHOTOS}
                accessibilityRole="button"
                accessibilityLabel="Add photos to this report"
                accessibilityState={{ disabled: busy !== null || proofPhotos.length >= MAX_PHOTOS }}
                style={[styles.photoButton, proofPhotos.length >= MAX_PHOTOS && styles.disabled]}
              >
                {busy === "photos" ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Camera size={19} color={colors.text} strokeWidth={2.2} />
                )}
                <Text style={styles.photoText}>
                  {proofPhotos.length >= MAX_PHOTOS ? "5 of 5 photos" : "Add photos"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {active && (
            <View style={card}>
              <Text style={[cardTitle, styles.cardTitleSpacing]}>While you wait</Text>
              {type.tips.map((tip, index) => (
                <View key={tip} style={styles.tip}>
                  <Text style={styles.tipNumber}>{index + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {(proofPhotos.length > 0 || resolutionPhotos.length > 0) && (
            <View style={card}>
              {proofPhotos.length > 0 && (
                <>
                  <Text style={[cardTitle, styles.cardTitleSpacing]}>Your photos</Text>
                  <PhotoRow photos={proofPhotos} onOpen={setLightbox} label="Your photo" />
                </>
              )}
              {resolutionPhotos.length > 0 && (
                <>
                  <Text style={[cardTitle, styles.cardTitleSpacing, proofPhotos.length > 0 && { marginTop: spacing.lg }]}>
                    Responder photos
                  </Text>
                  <PhotoRow photos={resolutionPhotos} onOpen={setLightbox} label="Responder photo" />
                </>
              )}
            </View>
          )}

          {status === "pending" && (
            <Pressable
              onPress={handleCancel}
              disabled={busy !== null}
              accessibilityRole="button"
              style={styles.cancel}
            >
              {busy === "cancel" ? (
                <ActivityIndicator color={colors.destructive} />
              ) : (
                <Text style={styles.cancelText}>Cancel report — no longer needed</Text>
              )}
            </Pressable>
          )}

          {!active && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Home")}
              accessibilityRole="button"
              style={styles.homeButton}
            >
              <Text style={styles.homeText}>Back to home</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={lightbox !== null} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <Pressable style={styles.lightbox} onPress={() => setLightbox(null)} accessibilityLabel="Close photo">
          {lightbox && <Image source={{ uri: lightbox }} style={styles.lightboxImage} resizeMode="contain" />}
        </Pressable>
      </Modal>
    </View>
  );
}

function PhotoRow({ photos, onOpen, label }: { photos: string[]; onOpen: (uri: string) => void; label: string }) {
  return (
    <View style={styles.photoRow}>
      {photos.map((uri, index) => (
        <Pressable
          key={`${index}-${uri.slice(-16)}`}
          onPress={() => onOpen(uri)}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${index + 1}, open`}
          style={styles.thumb}
        >
          <Image source={{ uri }} style={styles.thumbImage} />
        </Pressable>
      ))}
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
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: -spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  reportId: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  headline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headlineText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xxl,
    color: colors.white,
  },
  headlineSub: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.92)",
  },
  statusLine: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  statusLineText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleSpacing: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  callButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.text,
  },
  callText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  photoButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  photoText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  disabled: {
    opacity: 0.55,
  },
  tip: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  tipNumber: {
    width: 14,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.medical,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 21,
    color: colors.text,
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  cancelText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.destructive,
    textDecorationLine: "underline",
  },
  homeButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  homeText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  lightboxImage: {
    width: "100%",
    height: "80%",
  },
});
