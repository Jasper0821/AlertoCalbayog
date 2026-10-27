import React from "react";
import { shortPlusCode, isNearCalbayog } from "./plusCode.js";

/** Locality a short Plus Code is read against, written the way Google Maps writes it. */
export const CALBAYOG_LOCALITY = "Calbayog, Samar";

// Trailing city/province segments, stripped so the locality is appended exactly once
// whether or not the stored name already carried one.
const TRAILING_LOCALITY =
  /(?:^|,)\s*(?:city\s+of\s+calbayog|calbayog(?:\s+city)?|(?:western\s+)?samar|eastern\s+visayas|philippines|6710)\s*$/i;

function stripLocality(text) {
  let out = text.trim();
  while (TRAILING_LOCALITY.test(out)) out = out.replace(TRAILING_LOCALITY, "").trim();
  return out.replace(/^[,\s]+|[,\s]+$/g, "");
}

// A Plus Code such as "3H9V+8H2". Android's geocoder returns one as the place name when
// nothing nearby is named, and the app stored it as the landmark. It describes the
// geocoder's snapped point, not the GPS fix, so stored copies are dropped in favour of
// the one derived from the report's own coordinates.
const PLUS_CODE_TOKEN = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*/gi;

// What geocoders put in the barangay slot when they have no barangay: the province
// (Android's subregion is "Samar"), the city itself, or a generic "District".
const NOT_A_BARANGAY =
  /^(?:district|calbayog(?:\s+city)?|(?:western\s+)?samar|eastern\s+visayas|philippines)$/i;

/** Drops stored Plus Codes and placeholder "Brgy. Samar"-style segments from a text. */
function tidyAddressText(text) {
  return String(text || "")
    .split(",")
    .map((part) => part.replace(PLUS_CODE_TOKEN, "").trim())
    .filter((part) => {
      if (!part) return false;
      const isBarangaySegment = /^(?:brgy\.?|barangay)(?:\s|$)/i.test(part);
      return !(isBarangaySegment && (!cleanBarangay(part) || NOT_A_BARANGAY.test(cleanBarangay(part))));
    })
    .join(", ");
}

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

/**
 * The incident's street-level address from its own fields, without city or province,
 * or "" when nothing was resolved.
 *
 * Deliberately never falls back to the reporter's registered home address. Doing so
 * produced a confident, readable, wrong location for any emergency reported away
 * from home — worse than showing coordinates, because a responder acts on it. Use
 * reporterAddress() to show that separately and labelled.
 */
function incidentAddress(location, stripCity) {
  const street = tidyAddressText(location.street);
  const barangay = NOT_A_BARANGAY.test(cleanBarangay((location.barangay || "").trim()))
    ? ""
    : (location.barangay || "").trim();
  const purok = (location.purok || "").trim();
  const landmark = tidyAddressText(location.landmark);
  // `location.address` has never existed on the EmergencyReport schema — dropped.
  const rawName = tidyAddressText(location.name);

  // The incident's own landmark is the single most useful line for a responder,
  // so it leads whenever the device or geocoder captured one.
  if (landmark) {
    const tail = [street, purok, barangay ? formatBarangay(barangay) : ""].filter(
      (part) => part && !landmark.toLowerCase().includes(part.toLowerCase())
    );
    return [landmark, ...tail].join(", ");
  }

  if (rawName) {
    const cleanedName = rawName
      .replace(/,?\s*brgy\.?\s*district,?/gi, "")
      .replace(/,?\s*district,?/gi, "")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
    const name = stripCity ? stripLocality(cleanedName) : cleanedName;

    if (name && !/^(calbayog|calbayog city)$/i.test(name)) {
      return name;
    }
  }

  const parts = [];
  if (street) parts.push(street);
  if (purok && !parts.some((p) => p.toLowerCase().includes(purok.toLowerCase()))) {
    parts.push(purok);
  }
  if (barangay && !parts.some((p) => p.toLowerCase().includes(barangay.toLowerCase()))) {
    parts.push(formatBarangay(barangay));
  }

  return parts.join(", ");
}

/**
 * Human-readable position of AN INCIDENT, in the format Google Maps uses:
 * "3H9V+7HG, Rosales Blvd, Brgy. X, Calbayog, Samar".
 *
 * The Plus Code is derived from the report's coordinates, so it is present even when
 * no street address could be resolved, and pasting the whole string into Google Maps
 * pins the incident to within a few metres.
 */
export function formatLocationForTable(location) {
  if (!location) return "Unknown Location";

  if (typeof location === "string") {
    const cleaned = location
      .replace(/,?\s*brgy\.?\s*district,?/gi, "")
      .replace(/,?\s*district,?/gi, "")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();

    const text = cleaned || location;
    return /calbayog/i.test(text) ? text : `${text}, ${CALBAYOG_LOCALITY}`;
  }

  const lat = location.latitude;
  const lng = location.longitude;
  const plusCode = shortPlusCode(lat, lng);

  // Without usable coordinates there is no Plus Code; the address alone is all there is.
  if (!plusCode) {
    const address = incidentAddress(location, true);
    return address ? `${address}, ${CALBAYOG_LOCALITY}` : "Unknown Location";
  }

  // A short code means the point is in Calbayog and is read against it. Anything
  // further out gets the full code and its stored name untouched, never a wrong city.
  if (isNearCalbayog(lat, lng)) {
    return [plusCode, incidentAddress(location, true), CALBAYOG_LOCALITY]
      .filter(Boolean)
      .join(", ");
  }
  return [plusCode, incidentAddress(location, false)].filter(Boolean).join(", ");
}

/**
 * The reporter's registered home address, for display as clearly-labelled context
 * beside the incident location — never as the incident location itself.
 */
export function reporterAddress(report) {
  const address = (report?.userId?.completeAddress || "").trim();
  const barangay = (report?.userId?.barangay || "").trim();
  if (address) return address;
  if (barangay && !/^(district|calbayog)$/i.test(barangay)) return formatBarangay(barangay);
  return "";
}

/**
 * Text to paste into Google Maps to find the incident: "3H9V+7HF Calbayog, Samar"
 * (the search form Google documents for Plus Codes), the full code outside Calbayog,
 * or "" without usable coordinates.
 */
export function plusCodeSearchText(location) {
  const lat = location?.latitude;
  const lng = location?.longitude;
  const code = shortPlusCode(lat, lng);
  if (!code) return "";
  return isNearCalbayog(lat, lng) ? `${code} ${CALBAYOG_LOCALITY}` : code;
}

/**
 * Coordinates as "12.068175, 124.593938": latitude first, six decimals (about 10 cm),
 * the form Google Maps searches directly. "" without usable coordinates.
 */
export function gpsText(location) {
  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return "";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Google Maps directions link for a report, or "" when it has no usable position. */
export function directionsUrl(report) {
  const lat = Number(report?.location?.latitude);
  const lng = Number(report?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** "±12 m" when the device reported GPS uncertainty, otherwise "". */
export function accuracyLabel(report) {
  const accuracy = Number(report?.location?.accuracy);
  if (!Number.isFinite(accuracy) || accuracy <= 0) return "";
  return `±${Math.round(accuracy)} m`;
}

/** Statuses after which a report can no longer be dispatched. */
export const ENDED_STATUSES = ["cancelled", "rejected", "resolved", "closed"];

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

/**
 * Visual identity for each responding agency, shared by the admin live map,
 * its legend and any table that needs to show who is handling an incident.
 */
export const AGENCY_STYLES = {
  BFP: {
    label: "BFP",
    fullName: "Bureau of Fire Protection",
    color: "#dc2626",
    chip: "bg-red-50 text-red-700 border-red-200",
  },
  CDRRMO: {
    label: "CDRRMO",
    fullName: "City Disaster Risk Reduction & Management Office",
    color: "#0891b2",
    chip: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  PNP: {
    label: "PNP",
    fullName: "Philippine National Police",
    color: "#7c3aed",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
  },
  UNASSIGNED: {
    label: "Unassigned",
    fullName: "No agency has taken this incident yet",
    color: "#d97706",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

/**
 * Works out which agency is actually handling an incident.
 *
 * `assignedAgency` is authoritative and is written when an agency user dispatches
 * (reportController.updateReportStatus). Reports created before that existed fall back
 * to the actionLog, then to "not yet taken" — `notifiedAgencies` alone only says who
 * was *alerted*, which is not the same question.
 *
 * Returns { agency, confirmed, notified }:
 *   agency    - "BFP" | "CDRRMO" | "PNP" | null
 *   confirmed - true when the agency genuinely took the incident
 *   notified  - every agency that was alerted
 */
export function getRespondingAgency(report) {
  const notified = Array.isArray(report?.notifiedAgencies) ? report.notifiedAgencies : [];

  const assigned = report?.assignedAgency;
  if (assigned && assigned !== "NONE" && AGENCY_STYLES[assigned]) {
    return { agency: assigned, confirmed: true, notified };
  }

  // Older reports predate assignedAgency being written — recover it from the log entry
  // that moved the incident into "responding".
  const log = Array.isArray(report?.actionLog) ? report.actionLog : [];
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const entry = log[i];
    if (entry?.toStatus === "responding" && entry?.actorAgency && AGENCY_STYLES[entry.actorAgency]) {
      return { agency: entry.actorAgency, confirmed: true, notified };
    }
  }

  return { agency: null, confirmed: false, notified };
}

export function getAgencyStyle(agency) {
  return AGENCY_STYLES[agency] || AGENCY_STYLES.UNASSIGNED;
}

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

/**
 * A stable, human-readable id for an incident.
 *
 * EmergencyReport has no `incidentId` field, so the fallback always runs. It used to be
 * derived from the row's position (`90 - (index % 9)`), which meant only nine distinct
 * ids existed, rows 0 and 9 collided, the same incident changed id when the table was
 * sorted or filtered, and callers that passed no index rendered "INC-2026-0NaN".
 *
 * Deriving it from the immutable Mongo _id instead makes it unique and identical in
 * every view — the queue, the detail modal, the CSV export and the PDF all agree.
 * `index` is accepted only as a last-resort fallback for records with no _id.
 */
export function getIncidentId(report, index) {
  if (report?.incidentId) return report.incidentId;

  const d = report?.createdAt ? new Date(report.createdAt) : new Date();
  const yr = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();

  const id = report?._id ? String(report._id) : "";
  if (id) return `INC-${yr}-${id.slice(-6).toUpperCase()}`;

  const seq = Number.isFinite(index) ? index + 1 : 0;
  return `INC-${yr}-${String(seq).padStart(4, "0")}`;
}
