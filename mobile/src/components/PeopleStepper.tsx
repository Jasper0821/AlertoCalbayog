import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export default function PeopleStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label = "People who need help",
}: Props) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          accessibilityRole="button"
          accessibilityLabel="Fewer people"
          accessibilityState={{ disabled: !canDecrease }}
          style={styles.button}
        >
          <Minus size={20} color={canDecrease ? colors.text : colors.disabled} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.value} accessibilityLabel={`${value} ${value === 1 ? "person" : "people"}`}>
          {value}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          accessibilityRole="button"
          accessibilityLabel="More people"
          accessibilityState={{ disabled: !canIncrease }}
          style={styles.button}
        >
          <Plus size={20} color={canIncrease ? colors.text : colors.disabled} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 32,
    textAlign: "center",
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
});
