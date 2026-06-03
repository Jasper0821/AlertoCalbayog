import React from "react";

export const STATUS_STYLES = {
  pending:     { dot: "bg-amber-400",  text: "text-amber-600",   label: "Pending" },
  responding:  { dot: "bg-blue-500",   text: "text-blue-600",    label: "Responding" },
  resolved:    { dot: "bg-emerald-500",text: "text-emerald-600", label: "Resolved" },
  closed:      { dot: "bg-slate-400",  text: "text-slate-500",   label: "Closed" },
  ongoing:     { dot: "bg-orange-500", text: "text-orange-600",  label: "Ongoing" },
  cancelled:   { dot: "bg-red-400",    text: "text-slate-500",   label: "Cancelled" },
  dispatching: { dot: "bg-red-500",    text: "text-red-600",     label: "Dispatching" },
  active:      { dot: "bg-indigo-500", text: "text-indigo-600",  label: "Active" },
  en_route:    { dot: "bg-blue-500",   text: "text-blue-600",    label: "En Route" },
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

export const MOCK_REPORTS = [
  { _id: "m1", incidentId: "INC-2024-089", emergencyType: "fire",     userId: { fullName: "Juan Dela Cruz",  phoneNumber: "0917-123-4567" }, location: { name: "Brgy. Hamorawon, District 1" }, status: "dispatching", createdAt: new Date(Date.now() - 600000).toISOString() },
  { _id: "m2", incidentId: "INC-2024-088", emergencyType: "medical",   userId: { fullName: "Maria Santos",    phoneNumber: "0920-987-6543" }, location: { name: "Calbayog City Plaza" },          status: "active",      createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: "m3", incidentId: "INC-2024-087", emergencyType: "accident",  userId: { fullName: "Robert Wilson",   phoneNumber: "0998-555-0199" }, location: { name: "Maharlika Highway" },            status: "en_route",    createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: "m4", incidentId: "INC-2024-086", emergencyType: "flood",     userId: { fullName: "Elena Gilbert",   phoneNumber: "0912-333-4444" }, location: { name: "Riverside Subd." },              status: "resolved",    createdAt: new Date(Date.now() - 9000000).toISOString() },
  { _id: "m5", incidentId: "INC-2024-085", emergencyType: "police",    userId: { fullName: "Barangay Hall",   phoneNumber: "055-123-1234" },  location: { name: "Brgy. Nijaga, Waterfront" },     status: "ongoing",     createdAt: new Date(Date.now() - 12000000).toISOString() },
];
