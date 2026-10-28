const ApaarRegistry = require("../models/ApaarRegistry");

// 12-digit format check
const isValidFormat = (apaarId) => /^\d{12}$/.test(String(apaarId || "").trim());

// Mock APAAR registry lookup. Replace this function with the real
// APAAR/DigiLocker API call later; nothing else in the app changes.
const findApaar = async (apaarId) => {
  return ApaarRegistry.findOne({ apaarId: String(apaarId).trim() }).lean();
};

module.exports = { isValidFormat, findApaar };