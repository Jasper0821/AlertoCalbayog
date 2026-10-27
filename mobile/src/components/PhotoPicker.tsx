import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Camera, X } from "lucide-react-native";
import { card, cardTitle, colors, fonts, fontSize, radius, spacing } from "../theme";

export interface ScenePhoto {
  id: string;
  /** Inline data URI until the background upload swaps in the hosted URL. */
  uri: string;
  uploading: boolean;
}

interface Props {
  photos: ScenePhoto[];
  min: number;
  max: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
  /** Scroll target for the "add photos first" prompt. */
  onLayout?: (y: number) => void;
}

const TILE = 72;

export default function PhotoPicker({ photos, min, max, onAdd, onRemove, onLayout }: Props) {
  const missing = Math.max(0, min - photos.length);

  return (
    <View style={card} onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}>
      <View style={styles.titleRow}>
        <Text style={cardTitle}>
          Scene photos <Text style={styles.titleHint}>· {min} required</Text>
        </Text>
        <Text style={styles.counter}>
          {photos.length} of {max} added
        </Text>
      </View>

      <View style={styles.row}>
        {photos.map((photo, index) => (
          <View key={photo.id} style={styles.tile}>
            <Image source={{ uri: photo.uri }} style={styles.image} />
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>#{index + 1}</Text>
            </View>
            {photo.uploading && (
              <View style={styles.uploading}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
            <Pressable
              onPress={() => onRemove(photo.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${index + 1}`}
              style={styles.remove}
            >
              <X size={14} color={colors.white} strokeWidth={3} />
            </Pressable>
          </View>
        ))}

        {photos.length < max && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            style={[styles.tile, styles.addTile]}
          >
            <Camera size={22} color={colors.text} strokeWidth={2} />
            <Text style={styles.addText}>Add photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.helper, missing > 0 && styles.helperRequired]}>
        {missing > 0
          ? `Take ${missing} more photo${missing === 1 ? "" : "s"} of the scene so responders can verify the report.`
          : "Photos help responders prepare. You can add more after sending."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  titleHint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  counter: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  indexBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: "rgba(21,32,27,0.7)",
  },
  indexText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  uploading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(21,32,27,0.45)",
  },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(21,32,27,0.8)",
  },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.inputBorder,
    backgroundColor: colors.background,
  },
  addText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.text,
  },
  helper: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  helperRequired: {
    color: colors.destructive,
    fontFamily: fonts.semibold,
  },
});
