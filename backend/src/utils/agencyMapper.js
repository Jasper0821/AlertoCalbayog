const mapAgencies = (emergencyType) => {
  switch (emergencyType) {
    case "fire":
      return ["CDRRMO", "BFP"];
    case "crime":
      // PNP leads; CDRRMO is alerted as support because crimes often involve
      // injuries and CDRRMO runs the medical unit.
      return ["PNP", "CDRRMO"];
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