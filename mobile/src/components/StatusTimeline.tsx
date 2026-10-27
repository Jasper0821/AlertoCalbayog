import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { colors, fonts, fontSize, spacing } from "../theme";

export type StepState = "done" | "current" | "upcoming";

export interface TimelineStep {
  key: string;
  label: string;
  detail: string;
  state: StepState;
}

const DOT = 24;

export default function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const nextDone = !isLast && steps[index + 1].state !== "upcoming";
        return (
          <View
            key={step.key}
            style={styles.step}
            accessible
            accessibilityLabel={`${step.label}: ${
              step.state === "done" ? "done" : step.state === "current" ? "in progress" : "waiting"
            }. ${step.detail}`}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  step.state === "done" && styles.dotDone,
                  step.state === "current" && styles.dotCurrent,
                ]}
              >
                {step.state === "done" && <Check size={14} color={colors.white} strokeWidth={3} />}
              </View>
              {!isLast && <View style={[styles.line, nextDone && styles.lineDone]} />}
            </View>
            <View style={[styles.body, !isLast && styles.bodySpacing]}>
              <Text
                style={[
                  styles.label,
                  step.state === "current" && styles.labelCurrent,
                  step.state === "upcoming" && styles.labelUpcoming,
                ]}
              >
                {step.label}
              </Text>
              <Text style={styles.detail}>{step.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rail: {
    width: DOT,
    alignItems: "center",
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    backgroundColor: colors.medical,
    borderColor: colors.medical,
  },
  dotCurrent: {
    borderColor: colors.medical,
    borderWidth: 3,
  },
  line: {
    flex: 1,
    width: 2,
    minHeight: 20,
    backgroundColor: colors.inputBorder,
  },
  lineDone: {
    backgroundColor: colors.medical,
  },
  body: {
    flex: 1,
    paddingTop: 1,
  },
  bodySpacing: {
    paddingBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  labelCurrent: {
    fontFamily: fonts.extrabold,
  },
  labelUpcoming: {
    color: colors.textSecondary,
  },
  detail: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
