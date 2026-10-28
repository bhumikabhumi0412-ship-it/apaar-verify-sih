const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "INVALID_APAAR",
        "DUPLICATE_RECORD",
        "CROSS_INSTITUTION_DUPLICATE",
        "EXCESS_INTAKE",
        "DATA_INCONSISTENCY",
        "ENROLMENT_SPIKE",
      ],
      required: true,
    },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
    apaarId: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);