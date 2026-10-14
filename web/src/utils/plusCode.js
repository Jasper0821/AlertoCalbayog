/**
 * Plus Codes (Open Location Code), the "3H9V+7HG" codes Google Maps shows for places
 * without a street address. Computed offline from the report's own coordinates, so they
 * need no API key and work for every report ever stored.
 *
 * Follows the reference encoder at github.com/google/open-location-code, including its
 * integer arithmetic: floating-point division drifts across cell edges and produces a
 * code one cell over.
 */

const ALPHABET = "23456789CFGHJMPQRVWX";
const BASE = 20;
const PAIR_LENGTH = 10;
const GRID_LENGTH = 5;
const GRID_ROWS = 5;
const GRID_COLUMNS = 4;
const FINAL_LAT_PRECISION = 8000 * GRID_ROWS ** GRID_LENGTH;
const FINAL_LNG_PRECISION = 8000 * GRID_COLUMNS ** GRID_LENGTH;

// 11 digits is what Google Maps displays: a cell of roughly 3 m x 3 m.
const CODE_LENGTH = 11;

// Centre of Calbayog City. Short codes are recovered against the locality's centre.
const CALBAYOG_LAT = 12.0667;
const CALBAYOG_LNG = 124.6;

// The spec only drops the first four digits when the point is within 0.3 degrees of
// the reference; beyond that the short code could resolve to a different cell.
const SHORTEN_RANGE = 0.3;

function hasUsableCoords(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** Full Plus Code, e.g. "7Q463H9V+7HG", or "" when the coordinates are unusable. */
export function encodePlusCode(latitude, longitude) {
  let lat = Number(latitude);
  let lng = Number(longitude);
  if (!hasUsableCoords(lat, lng)) return "";

  if (lat === 90) lat -= 0.000025;
  if (lng === 180) lng = -180;

  let latVal = Math.floor(Math.round((lat + 90) * FINAL_LAT_PRECISION * 1e6) / 1e6);
  let lngVal = Math.floor(Math.round((lng + 180) * FINAL_LNG_PRECISION * 1e6) / 1e6);

  let code = "";
  for (let i = 0; i < GRID_LENGTH; i++) {
    code = ALPHABET[(latVal % GRID_ROWS) * GRID_COLUMNS + (lngVal % GRID_COLUMNS)] + code;
    latVal = Math.floor(latVal / GRID_ROWS);
    lngVal = Math.floor(lngVal / GRID_COLUMNS);
  }
  for (let i = 0; i < PAIR_LENGTH / 2; i++) {
    code = ALPHABET[lngVal % BASE] + code;
    code = ALPHABET[latVal % BASE] + code;
    latVal = Math.floor(latVal / BASE);
    lngVal = Math.floor(lngVal / BASE);
  }

  return `${code.slice(0, 8)}+${code.slice(8, CODE_LENGTH)}`;
}

/** True when a point is close enough to Calbayog to be described relative to it. */
export function isNearCalbayog(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!hasUsableCoords(lat, lng)) return false;
  return Math.max(Math.abs(lat - CALBAYOG_LAT), Math.abs(lng - CALBAYOG_LNG)) < SHORTEN_RANGE;
}

/**
 * The code as Google Maps displays it: "3H9V+7HG" when the point is in Calbayog (and
 * must then be read together with "Calbayog, Samar"), otherwise the full code.
 */
export function shortPlusCode(latitude, longitude) {
  const code = encodePlusCode(latitude, longitude);
  if (!code) return "";
  return isNearCalbayog(latitude, longitude) ? code.slice(4) : code;
}
