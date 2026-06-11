import React from "react";
import { STATUS_STYLES_BASE } from "../../../utils/incidentFormatters.js";

export {
  cleanBarangay,
  cleanPurok,
  formatBarangay,
  formatIncidentLocation,
  formatStreetPurok,
  getIncidentStatusInfo,
  getLocationParts,
  normalizeIncidentStatus
} from "../../../utils/incidentFormatters.js";

export const STATUS_STYLES = {
  ...STATUS_STYLES_BASE,
  verified: STATUS_STYLES_BASE.pending,
  active: STATUS_STYLES_BASE.responding,
  ongoing: STATUS_STYLES_BASE.responding,
  dispatching: STATUS_STYLES_BASE.responding,
  en_route: STATUS_STYLES_BASE.responding,
  responded: STATUS_STYLES_BASE.resolved,
  closed: STATUS_STYLES_BASE.resolved,
  cancelled: STATUS_STYLES_BASE.resolved,
};

export const PRIORITY_STYLES = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

// SVG icon definitions using React.createElement to keep utils as a standard .js file
export const TYPE_ICONS = {
  fire: {
    label: "Fire Emergency",
    color: "text-red-500",
    bgColor: "bg-red-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" }),
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" })
    ),
  },
  medical: {
    label: "Medical Assist",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" }),
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6M12 9v6" }),
      React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" })
    ),
  },
  police: {
    label: "Police Response",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" })
    ),
  },
  crime: {
    label: "Crime",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" })
    ),
  },
  flood: {
    label: "Flood Rescue",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 7c3-2 6 2 9 0s6-2 9 0M3 12c3-2 6 2 9 0s6-2 9 0M3 17c3-2 6 2 9 0s6-2 9 0" })
    ),
  },
  disaster: {
    label: "Disaster Rescue",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" })
    ),
  },
  accident: {
    label: "Vehicular Accident",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 10h7l-3 7H7l-3-7h6l1-4h2l1 4z" }),
      React.createElement("circle", { cx: "8", cy: "19", r: "1" }),
      React.createElement("circle", { cx: "16", cy: "19", r: "1" })
    ),
  },
  emergency: {
    label: "Emergency Response",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" })
    ),
  },
  others: {
    label: "Others Response",
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    icon: React.createElement(
      "svg",
      { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" })
    ),
  },
};

export function getPriority(report) {
  const type = (report.emergencyType || "").toLowerCase();
  if (type === "fire") return "critical";
  if (type === "medical") return "high";
  if (type === "flood" || type === "disaster") return "high";
  if (type === "crime" || type === "police") return "medium";
  return "medium";
}

export function getIncidentId(report, index) {
  if (report.incidentId) return report.incidentId;
  const d = report.createdAt ? new Date(report.createdAt) : new Date();
  const yr = d.getFullYear();
  return `INC-${yr}-0${String(90 - (index % 9)).padStart(2, "0")}`;
}

export const MOCK_REPORTS = [];

// Mock queue data for demo purposes – pending and active incidents
export const MOCK_QUEUE_REPORTS = {
  pending: [
    { _id: "q1", incidentId: "INC-2024-091", emergencyType: "crime", userId: { fullName: "Pedro Reyes", phoneNumber: "0918-777-8899" }, location: { name: "Brgy. Poblacion, Main Street", barangay: "Poblacion", street: "Main St.", purok: "Purok 2" }, status: "pending", createdAt: new Date(Date.now() - 300000).toISOString() },
    { _id: "q2", incidentId: "INC-2024-092", emergencyType: "crime", userId: { fullName: "Ariel Cabral", phoneNumber: "0921-888-7766" }, location: { name: "Brgy. Hamorawon, San Jose St.", barangay: "Hamorawon", street: "San Jose St.", purok: "Purok 4" }, status: "pending", createdAt: new Date(Date.now() - 600000).toISOString() },
    { _id: "q5", incidentId: "INC-2024-095", emergencyType: "crime", userId: { fullName: "Lito Lapid", phoneNumber: "0945-222-3344" }, location: { name: "Brgy. Dagum, Maharlika Hwy", barangay: "Dagum", street: "Maharlika Hwy", purok: "Purok 1" }, status: "pending", createdAt: new Date(Date.now() - 900000).toISOString() },
  ],
  active: [
    { _id: "q3", incidentId: "INC-2024-093", emergencyType: "crime", userId: { fullName: "Mike Cruz", phoneNumber: "0919-111-2222" }, location: { name: "Purok 3, Brgy. Nijaga, Calbayog City", barangay: "Nijaga", street: "Coastal Rd.", purok: "Purok 3" }, status: "responding", createdAt: new Date(Date.now() - 800000).toISOString() },
    { _id: "q4", incidentId: "INC-2024-094", emergencyType: "crime", userId: { fullName: "Sonia Santos", phoneNumber: "0932-444-5555" }, location: { name: "Purok 5, Brgy. Balud, Calbayog City", barangay: "Balud", street: "Riverside St.", purok: "Purok 5" }, status: "responding", createdAt: new Date(Date.now() - 1500000).toISOString() },
  ],
};
