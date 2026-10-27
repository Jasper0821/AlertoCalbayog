import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}

/** Multi-select pills. Optional: nothing here ever blocks sending. */
export default function SymptomChips({ options, selected, onToggle }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            key={option}
            onPress={() => onToggle(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  labelSelected: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
