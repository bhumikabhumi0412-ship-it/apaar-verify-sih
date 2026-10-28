const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const sign = (u) =>
  jwt.sign(
    {
      id: u._id,
      role: u.role,
      institution: u.institution || null,
      apaarId: u.apaarId || null,
    },
    process.env.JWT_SECRET || "change-me-in-env",
    { expiresIn: "8h" }
  );

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const u = await User.findOne({ email: email.toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(password, u.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    token: sign(u),
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      institution: u.institution || null,
      apaarId: u.apaarId || null,
    },
  });
});

module.exports = router;
