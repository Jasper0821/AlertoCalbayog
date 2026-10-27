const crypto = require("crypto");
const CALBAYOG_BARANGAYS = require("./calbayogBarangays");

/*
 * Voters-list matching without storing voter names.
 *
 * Each voter is reduced to an HMAC of their normalized name, barangay and (when the
 * list has it) birthdate. Only that fingerprint is saved, so a leaked database
 * reveals nobody without VOTER_MATCH_SECRET, which lives only in the host's
 * environment settings. Import and lookup must normalize identically, so both go
 * through voterMatchKey().
 */

const SUFFIXES = new Set(["JR", "SR", "II", "III", "IV", "V"]);

const clean = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Ñ -> N, accents dropped
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const withoutSuffixes = (value) =>
  clean(value)
    .split(" ")
    .filter((token) => token && !SUFFIXES.has(token))
    .join(" ");

/** "Dela Cruz" and "DELACRUZ" must match, so spaces inside a name are dropped. */
const squash = (value) => withoutSuffixes(value).replace(/ /g, "");

const CANONICAL_BARANGAYS = new Map(
  CALBAYOG_BARANGAYS.map((name) => [squash(name.replace(/^(brgy\.?|barangay)\s+/i, "")), name])
);

function normalizeBarangay(value) {
  const key = squash(String(value || "").replace(/^\s*(brgy\.?|barangay)\s+/i, ""));
  return CANONICAL_BARANGAYS.has(key) ? squash(CANONICAL_BARANGAYS.get(key)) : key;
}

/** YYYY-MM-DD from "1990-05-17", "05/17/1990", "1990/5/17" or a Date; "" if unreadable. */
function normalizeBirthdate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // Philippine lists use MM/DD/YYYY
  if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return "";
}

function normalizeVoter({ lastName, firstName, middleName, barangay, birthdate } = {}) {
  return {
    last: squash(lastName),
    first: squash(firstName),
    middleInitial: squash(middleName).slice(0, 1),
    barangay: normalizeBarangay(barangay),
    birthdate: normalizeBirthdate(birthdate),
  };
}

const secret = () => (process.env.VOTER_MATCH_SECRET || "").trim();
const isVoterMatchingConfigured = () => secret().length >= 16;

/**
 * The fingerprint for one person, or null when a required part is missing.
 * Birthdate is part of the key only when the imported list included it.
 */
function voterMatchKey(fields, includesBirthdate) {
  if (!isVoterMatchingConfigured()) throw new Error("VOTER_MATCH_SECRET is not configured.");
  const v = normalizeVoter(fields);
  if (!v.last || !v.first || !v.barangay) return null;
  if (includesBirthdate && !v.birthdate) return null;
  const parts = [v.last, v.first, v.middleInitial, v.barangay];
  if (includesBirthdate) parts.push(v.birthdate);
  return crypto.createHmac("sha256", secret()).update(parts.join("|")).digest("hex");
}

module.exports = { normalizeVoter, voterMatchKey, isVoterMatchingConfigured };
