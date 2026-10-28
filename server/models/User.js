const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        role: {
            type: String,
            enum: ["aicte_admin", "institution_admin", "verifier", "student"],
            required: true,
        },
        institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },
        apaarId: { type: String }, // for student users
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);