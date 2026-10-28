const mongoose = require("mongoose");

const apaarRegistrySchema = new mongoose.Schema({
  apaarId: { type: String, required: true, unique: true, match: /^\d{12}$/ },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
});

module.exports = mongoose.model("ApaarRegistry", apaarRegistrySchema);