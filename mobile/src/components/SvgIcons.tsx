import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function ArrowLeftIcon({ size = 22, color = "#0A1E3F" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 5L5 12L12 19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
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

/* ── 🏥 Medical Icon ──────────────────────────────────────── */
export function MedicalIcon({ size = 48, color = "#10B981" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cross background */}
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        fill={color}
        opacity={0.15}
      />
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Medical cross */}
      <Path
        d="M12 7V17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M7 12H17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Heartbeat pulse */}
      <Path
        d="M2 20L5 20L7 17L9 23L11 18L12 20L14 20"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
    </Svg>
  );
}

/* ── ⚠️ Others Icon ──────────────────────────────────────── */
export function OthersIcon({ size = 48, color = "#F59E0B" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circle background */}
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill={color}
        opacity={0.15}
      />
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Exclamation mark */}
      <Path
        d="M12 7V14"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="17.5" r="1.2" fill={color} />
      {/* Signal rays */}
      <Path
        d="M3 5L5.5 7"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M21 5L18.5 7"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M12 0V2"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
    </Svg>
  );
}

export function EyeIcon({ size = 24, color = "#9CA3AF" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.25 12C3.8 7.95 7.45 5.25 12 5.25C16.55 5.25 20.2 7.95 21.75 12C20.2 16.05 16.55 18.75 12 18.75C7.45 18.75 3.8 16.05 2.25 12Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function EyeOffIcon({ size = 24, color = "#9CA3AF" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3L21 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M10.58 5.42C11.04 5.31 11.51 5.25 12 5.25C16.55 5.25 20.2 7.95 21.75 12C21.26 13.28 20.56 14.42 19.69 15.38"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.9 17.46C15.47 18.29 13.81 18.75 12 18.75C7.45 18.75 3.8 16.05 2.25 12C3.01 10.02 4.26 8.37 5.85 7.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.88 9.88C9.34 10.42 9 11.17 9 12C9 13.66 10.34 15 12 15C12.83 15 13.58 14.66 14.12 14.12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = "#0A1E3F" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21A2 2 0 0 1 10.27 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 20, color = "#EF4444" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 11V17"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11V17"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HistoryIcon({ size = 22, color = "#0A1E3F" }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12L15 15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.05 11A9 9 0 1 1 5.38 16.5M3 17V12.5H7.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


