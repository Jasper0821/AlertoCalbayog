import React, { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Check, ChevronLeft, Phone, X } from "lucide-react-native";
import { HOTLINES } from "../components/EmergencyHotlineSheet";
import { showDialog } from "../utils/dialog";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { confirmReport, fetchReport } from "../api/reports";
import { getEmergencyType } from "../constants/emergencyTypes";
import { reportStatus } from "../constants/reportStatus";
import { incidentId, unbroken } from "../utils/incident";
import { card, cardTitle, colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  route: RouteProp<RootStackParamList, "ResolutionReport">;
  navigation: NativeStackNavigationProp<RootStackParamList, "ResolutionReport">;
}

// Agency that leads each type, for "I still need help" before one is recorded.
const LEAD_AGENCY: Record<string, string> = { fire: "BFP", crime: "PNP" };

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

/** What the responders did: their photos from the scene and who handled it. */
export default function ResolutionReportScreen({ route, navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { reportId } = route.params;
  const [report, setReport] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchReport(reportId)
      .then((data) => {
        setReport(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [reportId]);

  const evidence: string[] = Array.isArray(report?.resolutionEvidence) ? report.resolutionEvidence : [];
  const proof: string[] = Array.isArray(report?.proofPhotos) ? report.proofPhotos : [];
  const type = getEmergencyType(report?.emergencyType);
  const status = reportStatus(report?.status);
  const agency = report?.assignedAgency && report.assignedAgency !== "NONE" ? report.assignedAgency : "";
  const handledBy = [agency, report?.assignedResponder?.fullName].filter(Boolean).join(" · ");
  // Three per row, sized from the measured grid so borders and padding never push one down.
  const tile = gridWidth ? Math.floor((gridWidth - spacing.sm * 2) / 3) : 96;
  const StatusIcon = status.Icon;
  const finished = ["resolved", "closed"].includes(report?.status);
  const confirmedAt: string | null = report?.residentConfirmedAt || null;
  const helpAgency = agency || LEAD_AGENCY[(report?.emergencyType || "").toLowerCase()] || "CDRRMO";
  const helpLine = HOTLINES.find((h) => h.agency.startsWith(helpAgency));

  /** "Yes, resolved": moves the report to Closed in the resident's list. */
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmReport(reportId);
      setReport((prev: any) => ({ ...prev, residentConfirmedAt: updated?.residentConfirmedAt || new Date().toISOString() }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      DeviceEventEmitter.emit("reportStatusUpdated", { reportId });
    } catch (error: any) {
      showDialog("Not saved", error?.response?.data?.message || "Please check your connection and try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Resolution report
        </Text>
      </View>

      {state === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.medical} />
        </View>
      )}

      {state === "error" && (
        <View style={styles.center}>
          <Text style={styles.muted}>This report could not be loaded. Check your connection and try again.</Text>
        </View>
      )}

      {state === "ready" && report && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={card}>
            <View style={styles.summaryTop}>
              <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                <StatusIcon size={22} color={status.color} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>{status.title}</Text>
                <Text style={styles.muted}>
                  {type.label} · Report #{unbroken(incidentId(reportId, report.createdAt))}
                </Text>
              </View>
            </View>
            {[
              ["Handled by", handledBy],
              ["Resolved", formatDate(report.resolvedAt)],
              ["Location", report.location?.name || ""],
              ["Reason", report.status === "rejected" ? report.rejectionReason || "" : ""],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowValue}>{value}</Text>
                </View>
              ))}
          </View>

          {finished && report.resolutionNotes ? (
            <View style={card}>
              <Text style={[cardTitle, styles.titleSpacing]}>What responders did</Text>
              <Text style={styles.notes}>{report.resolutionNotes}</Text>
            </View>
          ) : null}

          {finished && !confirmedAt && (
            <View style={[card, styles.confirmCard]}>
              <Text style={cardTitle}>Are you okay?</Text>
              <Text style={[styles.muted, styles.confirmText]}>
                Responders marked this report as done. Check their photos below, then let us know.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                disabled={confirming}
                accessibilityRole="button"
                accessibilityState={{ busy: confirming }}
                style={styles.confirmButton}
              >
                {confirming ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Yes, resolved</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`tel:${helpLine?.dialNumber || "911"}`)}
                accessibilityRole="button"
                accessibilityLabel={`I still need help. Calls ${helpLine?.agency || "911"}`}
                style={styles.helpButton}
              >
                <Phone size={18} color={colors.text} strokeWidth={2} />
                <Text style={styles.helpButtonText}>I still need help</Text>
              </TouchableOpacity>
            </View>
          )}

          {finished && confirmedAt && (
            <View style={styles.confirmedNote} accessibilityLiveRegion="polite">
              <Check size={18} color={colors.badgeText} strokeWidth={2.4} />
              <Text style={styles.confirmedText}>You confirmed this is resolved · {formatDate(confirmedAt)}</Text>
            </View>
          )}

          {finished && (
          <View style={card}>
            <Text style={[cardTitle, styles.titleSpacing]}>Photos from responders</Text>
            {evidence.length === 0 ? (
              <Text style={styles.muted}>The responders did not attach photos to this report.</Text>
            ) : (
              <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
                {evidence.map((uri, index) => (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    key={`${index}-${uri.slice(-16)}`}
                    onPress={() => setOpenIndex(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Responder photo ${index + 1} of ${evidence.length}, open`}
                    style={[styles.photo, { width: tile, height: tile }]}
                  >
                    <Image source={{ uri }} style={styles.photoImage} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          )}

          {proof.length > 0 && (
            <View style={card}>
              <Text style={[cardTitle, styles.titleSpacing]}>Your photos</Text>
              <View style={styles.grid}>
                {proof.map((uri, index) => (
                  <View key={`${index}-${uri.slice(-16)}`} style={[styles.photo, { width: tile, height: tile }]}>
                    <Image source={{ uri }} style={styles.photoImage} accessibilityLabel={`Your photo ${index + 1}`} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={openIndex !== null} transparent animationType="fade" onRequestClose={() => setOpenIndex(null)}>
        <View style={styles.lightbox}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setOpenIndex(null)}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            style={[styles.close, { top: insets.top + spacing.sm }]}
          >
            <X size={24} color={colors.white} />
          </TouchableOpacity>
          {openIndex !== null && (
            <>
              <Image source={{ uri: evidence[openIndex] }} style={styles.lightboxImage} resizeMode="contain" />
              <Text style={styles.lightboxCount}>
                {openIndex + 1} of {evidence.length}
              </Text>
            </>
          )}
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    width: 92,
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  titleSpacing: {
    marginBottom: spacing.md,
  },
  notes: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.text,
  },
  confirmCard: {
    backgroundColor: "#F4FAF7",
    borderColor: "#BFE0D1",
  },
  confirmText: {
    marginTop: 4,
    marginBottom: spacing.md,
    fontSize: fontSize.md,
    lineHeight: 21,
  },
  confirmButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.medical,
  },
  confirmButtonText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.white,
  },
  helpButton: {
    minHeight: 48,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  helpButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  confirmedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.badgeBg,
  },
  confirmedText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.badgeText,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photo: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  lightbox: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  close: {
    position: "absolute",
    right: spacing.lg,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  lightboxImage: {
    width: "100%",
    height: "78%",
  },
  lightboxCount: {
    marginTop: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
