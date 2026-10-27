import { Archive, Check, Inbox, Siren, UserCheck, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type ReportStatusKey = "pending" | "assigned" | "responding" | "resolved" | "closed" | "rejected" | "cancelled";

export interface ReportStatusMeta {
  /** Card title. Matches backend/src/utils/reportStatusCopy.js, used for push and in-app alike. */
  title: string;
  body: string;
  /** Short label for the history list. */
  step: string;
  color: string;
  bg: string;
  Icon: LucideIcon;
}

const GREEN = { color: "#0B6B4F", bg: "#E3F3EC" };
const GREY = { color: "#6B7580", bg: "#EEF1EF" };

export const REPORT_STATUS: Record<ReportStatusKey, ReportStatusMeta> = {
  pending: {
    title: "Your report was received",
    body: "Dispatch has your report and location. A team is being assigned.",
    step: "Report received",
    ...GREY,
    Icon: Inbox,
  },
  assigned: {
    title: "A responder is assigned",
    body: "A responder is handling your report and will head out soon.",
    step: "Responder assigned",
    color: "#8A5A00",
    bg: "#FDF1D8",
    Icon: UserCheck,
  },
  responding: {
    title: "Responders are on the way",
    body: "Responders are heading to your location. Keep your phone nearby.",
    step: "Responders on the way",
    color: "#1F5FA0",
    bg: "#E3EEF9",
    Icon: Siren,
  },
  resolved: {
    title: "Your report is resolved",
    body: "Responders finished at the scene and shared photos of what they did.",
    step: "Resolved at the scene",
    ...GREEN,
    Icon: Check,
  },
  closed: {
    title: "Your report is closed",
    body: "This report is closed. Thank you for reporting.",
    step: "Report closed",
    ...GREEN,
    Icon: Archive,
  },
  rejected: {
    title: "Your report was not accepted",
    body: "Dispatch could not accept this report. Call the hotline if you still need help.",
    step: "Not accepted",
    color: "#A12E19",
    bg: "#FBE9E5",
    Icon: X,
  },
  cancelled: {
    title: "You cancelled this report",
    body: "This report was withdrawn and responders were told.",
    step: "Cancelled by you",
    ...GREY,
    Icon: X,
  },
};

export function reportStatus(status: string | undefined): ReportStatusMeta {
  return REPORT_STATUS[(status || "pending") as ReportStatusKey] || REPORT_STATUS.pending;
}
