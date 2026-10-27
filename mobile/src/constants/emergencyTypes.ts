import { Flame, Plus, ShieldAlert, TriangleAlert, WavesArrowUp } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export interface EmergencyTypeMeta {
  label: string;
  /** Banner colour. White text on it passes 4.5:1. */
  color: string;
  Icon: LucideIcon;
  /** Quick "What's happening?" chips. Saved with the report and shown to dispatch. */
  symptoms: string[];
  /** "While you wait" guidance on the status screen. */
  tips: string[];
  /** Home tile: short examples, and the light tint behind the tile. */
  hint: string;
  tint: string;
  tintBorder: string;
}

const MEET_RESPONDERS = "Send someone to meet responders at the road or landmark.";

const MEDICAL: EmergencyTypeMeta = {
  label: "Medical emergency",
  color: "#0B6B4F",
  Icon: Plus,
  symptoms: ["Not breathing", "Unconscious", "Heavy bleeding", "Chest pain", "Fall or injury", "Other"],
  tips: ["Stay with the person and keep this app open.", MEET_RESPONDERS, "If things get worse, call 911 right away."],
  hint: "Injury, illness, unconscious",
  tint: "#E3F3EC",
  tintBorder: "#C3E2D4",
};

// Keys match the backend's EmergencyReport.emergencyType enum.
const TYPES: Record<string, EmergencyTypeMeta> = {
  medical: MEDICAL,
  emergency: MEDICAL,
  fire: {
    label: "Fire emergency",
    color: "#B3341C",
    Icon: Flame,
    symptoms: ["Building on fire", "Smoke only", "People trapped", "Spreading fast", "Gas leak", "Other"],
    tips: ["Get everyone out and do not go back inside.", MEET_RESPONDERS, "If the fire spreads, call 911 right away."],
    hint: "Smoke, flames, burning",
    tint: "#FCE9E4",
    tintBorder: "#F2CFC7",
  },
  flood: {
    label: "Flood emergency",
    color: "#1F5FA0",
    Icon: WavesArrowUp,
    symptoms: ["Rising water", "People stranded", "Need evacuation", "Strong current", "Landslide", "Other"],
    tips: ["Move to higher ground and keep this app open.", "Stay away from moving water and power lines.", "If the water keeps rising, call 911 right away."],
    hint: "Rising water, trapped",
    tint: "#E3EEF9",
    tintBorder: "#C6D8EE",
  },
  crime: {
    label: "Crime / police",
    color: "#5B3FA8",
    Icon: ShieldAlert,
    symptoms: ["Robbery", "Fight or assault", "Weapon involved", "Break-in", "Suspicious person", "Other"],
    tips: ["Get to a safe place. Do not confront anyone.", "Remember faces, clothes, vehicles and which way they went.", "If you are in danger, call 911 right away."],
    hint: "Theft, violence, threat",
    tint: "#ECE8F7",
    tintBorder: "#D5CEEC",
  },
  others: {
    label: "Other emergency",
    color: "#8A5300",
    Icon: TriangleAlert,
    symptoms: ["Vehicle accident", "Fallen power line", "Fallen tree", "Missing person", "Animal attack", "Other"],
    tips: ["Stay at a safe distance and keep this app open.", MEET_RESPONDERS, "If things get worse, call 911 right away."],
    hint: "Landslide, accident, anything else",
    tint: "#E6ECE9",
    tintBorder: "#D3DBD7",
  },
};

export function getEmergencyType(type: string | undefined): EmergencyTypeMeta {
  return TYPES[(type || "").toLowerCase()] || TYPES.others;
}
