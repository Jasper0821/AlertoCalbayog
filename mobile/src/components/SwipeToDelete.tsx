import React, { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Trash } from "lucide-react-native";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
}

/**
 * Swipe left to delete. Only a clearly horizontal drag is captured, so vertical
 * scrolling through the list is unaffected. Screen-reader users get the same
 * action through the card's "More options" menu.
 */
export default function SwipeToDelete({ children, onDelete }: Props) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => x.setValue(Math.min(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -Math.min(120, width * 0.3) || g.vx < -0.8) {
            Animated.timing(x, { toValue: -width, duration: 180, useNativeDriver: true }).start(() => {
              onDeleteRef.current();
              x.setValue(0);
            });
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [width, x]
  );

  // Hidden at rest so the red never peeks out around the card's rounded corners.
  const behindOpacity = x.interpolate({ inputRange: [-40, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <View>
      <Animated.View style={[styles.behind, { opacity: behindOpacity }]} importantForAccessibility="no-hide-descendants">
        <Trash size={20} color={colors.white} strokeWidth={2} />
        <Text style={styles.behindText}>Delete</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  behind: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.urgent,
  },
  behindText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
