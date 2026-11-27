import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { captureIdPhoto } from "../utils/capturePhoto";
import { showDialog } from "../utils/dialog";
import { DOCUMENT_LABELS, type VoterIdDocument } from "../api/voterId";

export interface VoterIdDraft {
  documentType: VoterIdDocument;
  /** JPEG data URIs, kept on the phone until the resident sends them. */
  front: string | null;
  selfie: string | null;
  consent: boolean;
}

export const emptyVoterIdDraft: VoterIdDraft = { documentType: "voters_id", front: null, selfie: null, consent: false };

export const isVoterIdStarted = (draft: VoterIdDraft): boolean => Boolean(draft.front || draft.selfie);

/** What is still missing before the draft can be sent, or "" when it's ready. */
export function voterIdMissing(draft: VoterIdDraft): string {
  if (!draft.front) return `Take a photo of the front of your ${DOCUMENT_LABELS[draft.documentType]}.`;
  if (!draft.selfie) return "Take a selfie holding your document next to your face.";
  if (!draft.consent) return "Tick the box to let the City view your photos.";
  return "";
}

interface Props {
  value: VoterIdDraft;
  onChange: (next: VoterIdDraft) => void;
  disabled?: boolean;
}

type Side = "front" | "selfie";

const DOCUMENTS = Object.keys(DOCUMENT_LABELS) as VoterIdDocument[];

/**
 * Collects a Voter's ID (or Voter's Certification) photo and a selfie holding it.
 * Used at sign-up and on the Profile screen; the caller decides when to send.
 */
export default function VoterIdForm({ value, onChange, disabled = false }: Props): React.JSX.Element {
  const [capturing, setCapturing] = useState<Side | null>(null);
  const documentName = DOCUMENT_LABELS[value.documentType];

  const take = async (side: Side, fromGallery = false) => {
    if (disabled || capturing) return;
    setCapturing(side);
    try {
      const photo = await captureIdPhoto({ selfie: side === "selfie", fromGallery });
      if (photo) onChange({ ...value, [side]: photo });
    } catch {
      showDialog("Couldn't get the photo", "Please try again.");
    } finally {
      setCapturing(null);
    }
  };

  const renderSlot = (side: Side, title: string, hint: string) => {
    const photo = value[side];
    return (
      <View style={styles.slot}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => take(side)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={photo ? `${title}. Photo taken. Tap to retake.` : `${title}. Tap to take the photo.`}
          style={[styles.slotBox, !photo && styles.slotBoxEmpty]}
        >
          {capturing === side ? (
            <ActivityIndicator color="#38BDF8" />
          ) : photo ? (
            <Image source={{ uri: photo }} style={styles.slotImage} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.slotIcon}>{side === "front" ? "🪪" : "🤳"}</Text>
              <Text style={styles.slotCta}>TAP TO TAKE</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.slotTitle}>{title}</Text>
        <Text style={styles.slotHint}>{photo ? "Tap the photo to retake it" : hint}</Text>
        {side === "front" && (
          <TouchableOpacity onPress={() => take("front", true)} disabled={disabled} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.galleryLink}>Choose from gallery</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.note}>
        Send a photo of your Voter's ID or Voter's Certification and a selfie holding it. A City administrator checks
        them and gives you a "Verified resident" tag that responders see on your reports. The photos are deleted after
        the review.
      </Text>

      <Text style={styles.label}>DOCUMENT</Text>
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        {DOCUMENTS.map((doc) => {
          const selected = value.documentType === doc;
          return (
            <TouchableOpacity
              key={doc}
              activeOpacity={0.8}
              onPress={() => onChange({ ...value, documentType: doc })}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{DOCUMENT_LABELS[doc]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>PHOTOS</Text>
      <View style={styles.slotRow}>
        {renderSlot("front", `Front of your ${documentName}`, "Whole document, readable, no glare")}
        {renderSlot("selfie", "Selfie holding it", "Hold it next to your face")}
      </View>

      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => onChange({ ...value, consent: !value.consent })}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value.consent }}
      >
        <View style={[styles.checkbox, value.consent && styles.checkboxChecked]}>
          {value.consent && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          I agree to let City administrators view these photos to verify me. They are deleted after the review.
        </Text>
      </TouchableOpacity>

      {isVoterIdStarted(value) && !disabled && (
        <TouchableOpacity
          onPress={() => onChange({ ...emptyVoterIdDraft, documentType: value.documentType })}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.removeLink}>Remove photos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  label: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#040C1A",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "#0A1D38",
  },
  chipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#38BDF8",
  },
  slotRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  slot: {
    flex: 1,
  },
  slotBox: {
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A1D38",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  slotBoxEmpty: {
    borderStyle: "dashed",
    borderColor: "#38BDF8",
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
  slotIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  slotCta: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  slotTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  slotHint: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  galleryLink: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  checkmark: {
    color: "#040C1A",
    fontSize: 11,
    fontWeight: "900",
  },
  consentText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  removeLink: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
  },
});
