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
};

export function getIncidentStatusInfo(status) {
  const normalized = normalizeIncidentStatus(status);
  
  const infoMap = {
    pending: { label: "Pending", className: STATUS_STYLES_BASE.pending },
    responding: { label: "Responding", className: STATUS_STYLES_BASE.responding },
    resolved: { label: "Resolved", className: STATUS_STYLES_BASE.resolved },
  };
  
  return infoMap[normalized] || { label: status || "Unknown", className: "bg-slate-100 text-slate-700 border-slate-200" };
}
