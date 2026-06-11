const VALID_REPORT_STATUSES = ["pending", "responding", "resolved"];

const LEGACY_STATUS_MAP = {
  verified: "pending",
  acknowledged: "responding",
  "verified / acknowledged": "responding",
  active: "responding",
  ongoing: "responding",
  dispatching: "responding",
  en_route: "responding",
  "en route": "responding",
  responded: "resolved",
  closed: "resolved",
  cancelled: "resolved"
};

function normalizeReportStatus(status) {
  const raw = String(status || "pending").trim().toLowerCase();
  if (VALID_REPORT_STATUSES.includes(raw)) return raw;
  return LEGACY_STATUS_MAP[raw] || "pending";
}

module.exports = {
  VALID_REPORT_STATUSES,
  normalizeReportStatus
};
