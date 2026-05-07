import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

/* ── 🔥 Fire Icon ─────────────────────────────────────────── */
export function FireIcon({ size = 48, color = "#EF4444" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8.5 15 6.5C14.5 9 13 10 12 10C11 10 10 9 9.5 7.5C8.5 9.5 4 12.5 4 15.5C4 19.5 7.5 23 12 23Z"
        fill={color}
        opacity={0.2}
      />
      <Path
        d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8.5 15 6.5C14.5 9 13 10 12 10C11 10 10 9 9.5 7.5C8.5 9.5 4 12.5 4 15.5C4 19.5 7.5 23 12 23Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 23C14.2091 23 16 21.2091 16 19C16 16.7909 14 15 13 14C12.5 15.5 12 16 11 16C10 16 9.5 15.5 9 14.5C8.5 15.5 8 16.7909 8 19C8 21.2091 9.79086 23 12 23Z"
        fill={color}
        opacity={0.6}
      />
      <Path
        d="M8 1L9 5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 1L15 5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 0V3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ── 🌊 Flood Icon ────────────────────────────────────────── */
export function FloodIcon({ size = 48, color = "#0EA5E9" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 16C2 16 4 14 6 14C8 14 8 16 10 16C12 16 12 14 14 14C16 14 16 16 18 16C20 16 22 14 22 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 20C2 20 4 18 6 18C8 18 8 20 10 20C12 20 12 18 14 18C16 18 16 20 18 20C20 20 22 18 22 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
      <Path
        d="M12 3L12 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8 7L12 3L16 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

/* ── 🚨 Emergency Icon ────────────────────────────────────── */
export function EmergencyIcon({ size = 48, color = "#10B981" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 19H21L12 2Z"
        fill={color}
        opacity={0.15}
      />
      <Path
        d="M12 2L3 19H21L12 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9V13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16" r="1" fill={color} />
      {/* Siren rays */}
      <Path
        d="M5 7L7 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M19 7L17 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M1 22H23"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
      />
    </Svg>
  );
}

/* ── 🚔 Crime Icon ────────────────────────────────────────── */
export function CrimeIcon({ size = 48, color = "#8B5CF6" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C9.23858 2 7 4.23858 7 7V10H5L3 22H21L19 10H17V7C17 4.23858 14.7614 2 12 2Z"
        fill={color}
        opacity={0.15}
      />
      {/* Shield shape */}
      <Path
        d="M12 2L4 6V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V6L12 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2L4 6V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V6L12 2Z"
        fill={color}
        opacity={0.15}
      />
      {/* Badge star */}
      <Path
        d="M12 8V13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M9.5 10.5H14.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16" r="1" fill={color} />
    </Svg>
  );
}
