const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    apaarId: { type: String, required: true, match: /^\d{12}$/ },
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    course: { type: String, required: true },
    academicYear: { type: String, required: true },
    studentId: { type: String }, // institution's own ID / roll number
    category: { type: String }, // General, OBC, SC, ST, etc.
    isSupernumerary: { type: Boolean, default: false },
    isNRI: { type: Boolean, default: false },
    ociStatus: { type: Boolean, default: false },
    isForeignNational: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "dropped", "graduated"], default: "active" },
    consentGiven: { type: Boolean, default: false },
    signature: { type: String }, // HMAC of the verified record
  },
  { timestamps: true }
);

// Same student cannot be entered twice in the same institution and course
studentSchema.index({ apaarId: 1, institution: 1, course: 1 }, { unique: true });
// Fast lookup for cross-institution duplicate checks
studentSchema.index({ apaarId: 1 });

module.exports = mongoose.model("Student", studentSchema);