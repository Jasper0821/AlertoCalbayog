const COORDINATE_PATTERN = /^coordinates?:?\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/i;

export const STATUS_STYLES_BASE = {
  pending: {
    dot: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Pending"
  },
  responding: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Responding"
  },
  resolved: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Resolved"
  }
};

export function normalizeIncidentStatus(status) {
  const raw = String(status || "pending").trim().toLowerCase();
  if (raw === "responding" || raw === "active" || raw === "ongoing" || raw === "dispatching" || raw === "en_route" || raw === "en route") {
    return "responding";
  }
  if (raw === "resolved" || raw === "responded" || raw === "closed" || raw === "cancelled") {
    return "resolved";
  }
  return "pending";
}

export function getIncidentStatusInfo(status) {
  return STATUS_STYLES_BASE[normalizeIncidentStatus(status)] || STATUS_STYLES_BASE.pending;
}

function cleanText(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\b(calbayog\s+city|city\s+of\s+calbayog|calbayog|samar|philippines)\b/gi, "")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

export function cleanBarangay(value = "") {
  const cleaned = cleanText(value)
    .replace(/^(brgy\.?|barangay)\s+/i, "")
    .replace(/\s+district$/i, " District")
    .trim();
  if (!cleaned || COORDINATE_PATTERN.test(cleaned)) return "";
  return cleaned;
}

export function cleanPurok(value = "") {
  const cleaned = cleanText(value);
  const match = cleaned.match(/\bpurok\s+([a-z0-9 -]+)/i);
  if (!match?.[1]) return "";
  const name = match[1].replace(/,\s*.*/, "").trim();
  return name ? `Purok ${name}` : "";
}

function parseLocationString(value = "") {
  const text = String(value || "").trim();
  if (!text || COORDINATE_PATTERN.test(text)) return {};

  const purok = cleanPurok(text);
  const brgyMatch = text.match(/(?:brgy\.?|barangay)\s+([^,]+)/i);
  const barangay = brgyMatch ? cleanBarangay(brgyMatch[1]) : "";
  return { purok, barangay };
}

export function getLocationParts(reportOrLocation = {}) {
  const location = reportOrLocation?.location ?? reportOrLocation;
  if (typeof location === "string") return parseLocationString(location);

  const fromName = parseLocationString(location?.name);
  const barangay = cleanBarangay(location?.barangay) || fromName.barangay;
  const purok = cleanPurok(location?.purok) || cleanPurok(location?.street) || fromName.purok;

  return { barangay, purok };
}

export function formatIncidentLocation(reportOrLocation = {}) {
  const { barangay, purok } = getLocationParts(reportOrLocation);
  if (!barangay || !purok) return "Location not specified";
  return `${purok}, Brgy. ${barangay}, Calbayog City`;
}

export function formatBarangay(reportOrLocation = {}) {
  const { barangay } = getLocationParts(reportOrLocation);
  return barangay ? `Brgy. ${barangay}` : "Location not specified";
}

export function formatStreetPurok(reportOrLocation = {}) {
  const { purok } = getLocationParts(reportOrLocation);
  return purok || "Location not specified";
}
