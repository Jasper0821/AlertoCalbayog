import React from "react";

export function cleanBarangay(bgy) {
  if (!bgy) return "";
  return bgy.replace(/^brgy\.?\s*|^barangay\s*/i, "").trim();
}

export function cleanPurok(purok) {
  if (!purok) return "";
  return purok.trim();
}

export function formatBarangay(bgy) {
  if (!bgy) return "Unknown Barangay";
  const cleaned = cleanBarangay(bgy);
  return `Brgy. ${cleaned}`;
}

export function getLocationParts(location) {
  if (!location) return { barangay: "", street: "", purok: "", fullText: "Unknown Location" };
  
  if (typeof location === "string") {
    return { barangay: location, street: "", purok: "", fullText: location };
  }

  const barangay = location.barangay || "";
  const street = location.street || "";
  const purok = location.purok || "";
  const fullText = location.name || [street, purok, barangay].filter(Boolean).join(", ");
  
  return { barangay, street, purok, fullText };
}

export function formatStreetPurok(location) {
  const parts = getLocationParts(location);
  const result = [parts.street, parts.purok].filter(Boolean).join(", ");
  return result || "Unspecified Area";
}

export function formatIncidentLocation(location) {
  const parts = getLocationParts(location);
  if (parts.fullText) return parts.fullText;
  
  const bgy = formatBarangay(parts.barangay);
  const streetPurok = formatStreetPurok(location);
  
  if (!parts.barangay) return streetPurok;
  return `${streetPurok}, ${bgy}`;
}

export function formatLocationForTable(location, report) {
  const userAddress = (report?.userId?.completeAddress || "").trim();
  const userBarangay = (report?.userId?.barangay || "").trim();

  if (!location) {
    if (userAddress) return userAddress;
    if (userBarangay && !/^(district|calbayog)$/i.test(userBarangay)) {
      return userBarangay.toLowerCase().startsWith("brgy") ? userBarangay : `Brgy. ${userBarangay}`;
    }
    return "Unknown Location";
  }

  if (typeof location === "string") {
    const cleaned = location
      .replace(/,?\s*brgy\.?\s*district,?/gi, "")
      .replace(/,?\s*district,?/gi, "")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();

    if (userAddress && !cleaned.toLowerCase().includes(userAddress.toLowerCase())) {
      return cleaned && !/^(calbayog|calbayog city)$/i.test(cleaned)
        ? `${userAddress}, ${cleaned}`
        : userAddress;
    }
    if (cleaned && !/^(calbayog|calbayog city)$/i.test(cleaned)) {
      return cleaned;
    }
    if (userAddress) return userAddress;
    if (userBarangay && !/^(district|calbayog)$/i.test(userBarangay)) {
      return userBarangay.toLowerCase().startsWith("brgy") ? userBarangay : `Brgy. ${userBarangay}`;
    }
    return cleaned || location;
  }

  const street = (location.street || "").trim();
  const barangay = (location.barangay || "").trim();
  const purok = (location.purok || "").trim();
  const lat = location.latitude;
  const lng = location.longitude;
  const rawName = (location.name || location.address || "").trim();

  if (rawName) {
    const cleanedName = rawName
      .replace(/,?\s*brgy\.?\s*district,?/gi, "")
      .replace(/,?\s*district,?/gi, "")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();

    if (userAddress && !cleanedName.toLowerCase().includes(userAddress.toLowerCase())) {
      return cleanedName && !/^(calbayog|calbayog city)$/i.test(cleanedName)
        ? `${userAddress}, ${cleanedName}`
        : userAddress;
    }

    if (cleanedName && !/^(calbayog|calbayog city)$/i.test(cleanedName)) {
      return cleanedName;
    }
  }

  const parts = [];
  if (userAddress) parts.push(userAddress);
  if (street && !parts.some(p => p.toLowerCase().includes(street.toLowerCase()))) parts.push(street);
  if (purok && !parts.some(p => p.toLowerCase().includes(purok.toLowerCase()))) parts.push(purok);

  const safeBgy = barangay || userBarangay;
  if (safeBgy && !/^(district|calbayog)$/i.test(safeBgy) && !parts.some(p => p.toLowerCase().includes(safeBgy.toLowerCase()))) {
    parts.push(safeBgy.toLowerCase().startsWith("brgy") ? safeBgy : `Brgy. ${safeBgy}`);
  }

  if (parts.length > 0) return parts.join(", ");

  if (lat && lng) {
    return `[GPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}]`;
  }

  return "Unknown Location";
}

export function normalizeIncidentStatus(status) {
  if (!status) return "pending";
  const s = status.toLowerCase().trim();
  if (s === "closed" || s === "cancelled") return "resolved";
  if (s === "en_route" || s === "dispatching" || s === "ongoing" || s === "active") return "responding";
  if (s === "verified") return "pending";
  return s;
}

export const STATUS_STYLES_BASE = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  responding: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

export function getIncidentStatusInfo(status) {
  const normalized = normalizeIncidentStatus(status);
  
  const infoMap = {
    pending: { label: "Pending", className: STATUS_STYLES_BASE.pending },
    responding: { label: "Responding", className: STATUS_STYLES_BASE.responding },
    resolved: { label: "Resolved", className: STATUS_STYLES_BASE.resolved },
    rejected: { label: "Rejected", className: STATUS_STYLES_BASE.rejected },
  };
  
  return infoMap[normalized] || { label: status || "Unknown", className: "bg-slate-100 text-slate-700 border-slate-200" };
}

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
  rejected: STATUS_STYLES_BASE.rejected,
};

export const PRIORITY_STYLES = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

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
