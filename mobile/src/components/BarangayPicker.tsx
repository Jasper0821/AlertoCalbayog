import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, X } from "lucide-react-native";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  visible: boolean;
  current: string;
  onSelect: (barangay: string) => void;
  onClose: () => void;
}

/** Fallback for when the phone could not detect the barangay, or detected the wrong one. */
export default function BarangayPicker({ visible, current, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => CALBAYOG_BARANGAYS.filter((bgy) => bgy.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose barangay</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.search}>
          <Search size={18} color={colors.placeholder} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search barangay"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            autoFocus
          />
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onSelect(item);
                setQuery("");
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: item === current }}
              style={styles.item}
            >
              <Text style={styles.itemText}>{item}</Text>
              {item === current && <Check size={18} color={colors.medical} strokeWidth={2.6} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No barangay matches "{query}".</Text>}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  item: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  empty: {
    padding: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
