const mapAgency = (emergencyType) => {
  switch (emergencyType) {
    case "fire":
      return "BFP";
    case "flood":
      return "DRRMO";
    case "medical":
      return "EMS";
    default:
      return null;
  }
};

module.exports = mapAgency;