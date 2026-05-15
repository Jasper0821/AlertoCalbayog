/**
 * Maps an emergency type to the agencies that should be notified.
 * CDRRMO is the main hub — ALL reports go to CDRRMO.
 * BFP and PNP are additionally notified for relevant types.
 *
 * - fire      → CDRRMO + BFP
 * - medical   → CDRRMO
 * - others    → CDRRMO
 * - flood     → CDRRMO
 * - emergency → CDRRMO
 * - crime     → CDRRMO + PNP
 */
const mapAgencies = (emergencyType) => {
  switch (emergencyType) {
    case "fire":
      return ["CDRRMO", "BFP"];
    case "crime":
      return ["CDRRMO", "PNP"];
    case "medical":
    case "others":
    case "flood":
    case "emergency":
      return ["CDRRMO"];
    default:
      return null;
  }
};

module.exports = mapAgencies;