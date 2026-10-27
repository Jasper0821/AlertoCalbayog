import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ChevronLeft, Phone, Send } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import LocationCard from "../components/LocationCard";
import SymptomChips from "../components/SymptomChips";
import PeopleStepper from "../components/PeopleStepper";
import PhotoPicker, { type ScenePhoto } from "../components/PhotoPicker";
import { useReportLocation } from "../hooks/useReportLocation";
import { getEmergencyType } from "../constants/emergencyTypes";
import { submitReport } from "../api/reports";
import { showDialog } from "../utils/dialog";
import { uploadEvidenceImage } from "../api/uploads";
import { backendUrl } from "../api/axios";
import { clearStorage } from "../utils/Storage";
import { captureScenePhoto, ensureCameraPermission } from "../utils/capturePhoto";
import { card, cardTitle, colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  route: RouteProp<RootStackParamList, "EmergencyReport">;
  navigation: NativeStackNavigationProp<RootStackParamList, "EmergencyReport">;
}

// Proof photos verify a report is real. The backend rejects fewer than 2 or more than 5.
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 5;

/**
 * How long SEND waits for photos still uploading. Past this the report goes out
 * with those photos inline: a slow image host must never hold back an emergency.
 */
const UPLOAD_WAIT_MS = 15 * 1000;

const waitAtMost = (promise: Promise<unknown>, ms: number) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

export default function EmergencyReportScreen({ route, navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { emergencyType } = route.params;
  const type = getEmergencyType(emergencyType);
  const location = useReportLocation();

  const [landmark, setLandmark] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [photos, setPhotos] = useState<ScenePhoto[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Read after awaits, where the state captured by the closure is stale.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const uploadsRef = useRef(new Map<string, Promise<void>>());
  const capturingRef = useRef(false);
  const sentRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const photoCardY = useRef(0);

  const hasDraft = photos.length > 0 || landmark.trim() !== "" || note.trim() !== "" || symptoms.length > 0;

  // Backing out would silently throw away photos taken at the scene.
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (sentRef.current || !hasDraft) return;
        event.preventDefault();
        showDialog("Discard this report?", "Your photos and details will be lost.", [
          { text: "Keep editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(event.data.action) },
        ]);
      }),
    [navigation, hasDraft]
  );

  const toggleSymptom = (option: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSymptoms((prev) => (prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]));
  };

  /**
   * Keeps the camera open shot after shot until the resident backs out or hits
   * the limit. Each photo uploads in the background while the next is taken, and
   * the hosted URL replaces the inline image; on failure the inline image stays.
   */
  const handleAddPhoto = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    try {
      if (!(await ensureCameraPermission())) return;
      let count = photosRef.current.length;
      while (count < MAX_PHOTOS) {
        const uri = await captureScenePhoto();
        if (!uri) break;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setPhotos((prev) => [...prev, { id, uri, uploading: true }]);
        count += 1;

        const upload = uploadEvidenceImage(uri, "proof")
          .then((hosted) => {
            setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, uri: hosted, uploading: false } : p)));
          })
          .finally(() => uploadsRef.current.delete(id));
        uploadsRef.current.set(id, upload);
      }
    } catch {
      showDialog("Camera unavailable", "The photo could not be taken. Please try again.");
    } finally {
      capturingRef.current = false;
    }
  }, []);

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const missingPhotos = Math.max(0, MIN_PHOTOS - photos.length);
  const locationReady = location.status === "ready";
  const canSend = locationReady && missingPhotos === 0;

  const handleSend = async () => {
    if (sending) return;

    if (!locationReady) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      showDialog(
        "Turn on location",
        "Responders need your GPS location to find you. Turn on location to send this report.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Turn on location", onPress: location.enableLocation },
        ]
      );
      return;
    }

    if (missingPhotos > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      scrollRef.current?.scrollTo({ y: Math.max(0, photoCardY.current - spacing.lg), animated: true });
      showDialog(
        "Add scene photos",
        `Take ${missingPhotos} more photo${missingPhotos === 1 ? "" : "s"} of the scene so responders can verify the report.`,
        [
          { text: "Not now", style: "cancel" },
          { text: "Take photo", onPress: handleAddPhoto },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setSending(true);
    try {
      // Let in-flight uploads land so the report carries short hosted URLs
      // instead of megabytes of base64 — but never wait indefinitely.
      if (uploadsRef.current.size > 0) {
        await waitAtMost(Promise.allSettled([...uploadsRef.current.values()]), UPLOAD_WAIT_MS);
      }

      const where = await location.resolveSubmitPosition();
      if (!where) {
        showDialog(
          "Location unavailable",
          "We could not get your location. Make sure GPS is on, step near a window or outside, and try again.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "OK", style: "cancel" },
          ]
        );
        return;
      }

      const { reportId } = await submitReport(
        {
          type: emergencyType,
          latitude: where.position.latitude,
          longitude: where.position.longitude,
          accuracy: where.accuracy,
          barangay: location.barangay,
          street: location.street,
          purok: location.purok,
          landmark,
          symptoms,
          peopleCount,
          photos: photosRef.current.map((p) => p.uri),
          note,
        },
        setProgress
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      sentRef.current = true;
      // Replace, so Back from the status screen goes home instead of to a form
      // that would send the same emergency twice.
      navigation.replace("AlertSent", { reportId, emergencyType, peopleCount });
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        showDialog(
          "Sign in again",
          "Your sign-in has expired, so this report was not sent. Sign in and send it again, or call 911 now.",
          [
            { text: "Call 911", onPress: () => Linking.openURL("tel:911") },
            {
              text: "Sign in",
              onPress: async () => {
                await clearStorage();
                sentRef.current = true; // Leaving on purpose: skip the discard prompt.
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
              },
            },
          ]
        );
        return;
      }
      let message = error.response?.data?.message;
      if (!message) {
        if (status === 503) {
          message = "The server is starting up. Please wait a few seconds and tap Send again.";
        } else if (error.message === "Network Error") {
          message = `Cannot reach the server at ${backendUrl}. Check your connection, or call 911.`;
        } else {
          message = error.message || "The report could not be sent. Please try again.";
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      // 429 covers both a duplicate report and the 3-per-5-minutes limit; the
      // server's message says which.
      showDialog(status === 429 ? "Please wait" : "Not sent", message, [
        { text: "Call 911", onPress: () => Linking.openURL("tel:911") },
        { text: "OK", style: "cancel" },
      ]);
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  const blocker = !locationReady
    ? location.status === "checking"
      ? "Checking your location…"
      : "Turn on location to send."
    : missingPhotos > 0
    ? `Take ${missingPhotos} more scene photo${missingPhotos === 1 ? "" : "s"} to send.`
    : "";

  const TypeIcon = type.Icon;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <ChevronLeft size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">
            Report emergency
          </Text>
          <Text style={styles.subtitle}>Send first. Add details anytime.</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency type */}
          <View style={[styles.typeBanner, { backgroundColor: type.color }]}>
            <View style={styles.typeIcon}>
              <TypeIcon size={24} color={colors.white} strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.typeCaption}>REPORTING</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Change emergency type"
              style={styles.changeButton}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <LocationCard
            status={location.status}
            position={location.position}
            gpsPosition={location.gps?.position ?? null}
            accuracy={location.accuracy}
            pinPlaced={location.pin !== null}
            street={location.street}
            barangay={location.barangay}
            resolvingAddress={location.resolvingAddress}
            landmark={landmark}
            onLandmarkChange={setLandmark}
            onPinChange={location.placePin}
            onBarangayChange={location.chooseBarangay}
            onEnableLocation={location.enableLocation}
          />

          {/* What's happening */}
          <View style={card}>
            <Text style={cardTitle}>What's happening?</Text>
            <Text style={styles.cardSubtitle}>Tap all that apply — optional</Text>
            <SymptomChips options={type.symptoms} selected={symptoms} onToggle={toggleSymptom} />
            <View style={styles.divider} />
            <PeopleStepper value={peopleCount} onChange={setPeopleCount} />
          </View>

          <PhotoPicker
            photos={photos}
            min={MIN_PHOTOS}
            max={MAX_PHOTOS}
            onAdd={handleAddPhoto}
            onRemove={removePhoto}
            onLayout={(y) => (photoCardY.current = y)}
          />

          {/* Anything else */}
          <View>
            <Text style={styles.noteLabel}>
              Anything else? <Text style={styles.noteHint}>· optional</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Elderly man, collapsed on the stairs"
              placeholderTextColor={colors.placeholder}
              style={styles.noteInput}
              multiline
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Anything else, optional"
            />
          </View>
        </ScrollView>

        {/* Sticky footer: SEND is always on screen */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {blocker !== "" && (
            <Text style={styles.blocker} accessibilityLiveRegion="polite">
              {blocker}
            </Text>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={sending}
            accessibilityRole="button"
            accessibilityLabel="Send alert now"
            accessibilityHint={blocker || "Sends your emergency report and location to responders"}
            accessibilityState={{ disabled: sending, busy: sending }}
            style={[styles.sendButton, !canSend && !sending && styles.sendButtonBlocked]}
          >
            {sending ? (
              <>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.sendText}>
                  {progress > 0 && progress < 100 ? `Sending… ${progress}%` : "Sending…"}
                </Text>
              </>
            ) : (
              <>
                <Send size={22} color={colors.white} strokeWidth={2.4} />
                <Text style={styles.sendText}>Send alert now</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>Your location is shared when you send.</Text>
            <Pressable
              onPress={() => Linking.openURL("tel:911")}
              accessibilityRole="button"
              accessibilityLabel="Call 911 instead"
              hitSlop={10}
              style={styles.callLink}
            >
              <Phone size={15} color={colors.badgeText} strokeWidth={2.4} />
              <Text style={styles.callLinkText}>Call 911 instead</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.md,
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
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  typeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  typeCaption: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.9)",
  },
  typeLabel: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  changeButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  cardSubtitle: {
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  noteLabel: {
    marginBottom: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  noteHint: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  noteInput: {
    minHeight: 96,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  blocker: {
    marginBottom: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.destructive,
    textAlign: "center",
  },
  sendButton: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.urgent,
  },
  // Still pressable: tapping explains what is missing instead of doing nothing.
  sendButtonBlocked: {
    opacity: 0.55,
  },
  sendText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerNote: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  callLink: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callLinkText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.badgeText,
  },
});
