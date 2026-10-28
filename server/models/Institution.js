const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  academicYear: { type: String, required: true }, // e.g. "2026-27"
  approvedIntake: { type: Number, required: true },
});

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    aicteId: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    city: { type: String },
    courses: [courseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institution", institutionSchema);