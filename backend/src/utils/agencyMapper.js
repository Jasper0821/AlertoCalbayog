/**
 * Maps an emergency type to the agencies that should be notified.
 * Returns an array of agency codes.
 *
 * - fire      → CDRRMO + BFP
 * - flood     → CDRRMO
 * - emergency → CDRRMO
 * - crime     → PNP
 */
const mapAgencies = (emergencyType) => {
  switch (emergencyType) {
    case "fire":
      return ["CDRRMO", "BFP"];
    case "flood":
      return ["CDRRMO"];
    case "emergency":
      return ["CDRRMO"];
    case "crime":
      return ["PNP"];
    default:
      return null;
  }
};

module.exports = mapAgencies;