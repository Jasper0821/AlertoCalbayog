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