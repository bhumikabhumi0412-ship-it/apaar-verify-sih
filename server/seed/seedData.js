require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ApaarRegistry = require("../models/ApaarRegistry");
const Institution = require("../models/Institution");
const User = require("../models/User");
const Student = require("../models/Student");
const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");

const registry = [
  ["100000000001", "Aarav Sharma", "2005-03-14"],
  ["100000000002", "Diya Patel", "2005-07-21"],
  ["100000000003", "Rohan Gupta", "2004-11-02"],
  ["100000000004", "Ananya Rao", "2005-01-30"],
  ["100000000005", "Karthik Nair", "2004-09-18"],
  ["100000000006", "Meera Iyer", "2005-05-09"],
  ["100000000007", "Vikram Singh", "2004-12-25"],
  ["100000000008", "Sneha Reddy", "2005-08-12"],
  ["100000000009", "Arjun Mehta", "2005-02-27"],
  ["100000000010", "Priya Das", "2004-10-06"],
].map(([apaarId, name, dob]) => ({ apaarId, name, dob: new Date(dob) }));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing old data...");

  await Promise.all([
    ApaarRegistry.deleteMany(),
    Institution.deleteMany(),
    User.deleteMany(),
    Student.deleteMany(),
    Alert.deleteMany(),
    AuditLog.deleteMany(),
  ]);

  await ApaarRegistry.insertMany(registry);

  const [inst1, inst2] = await Institution.insertMany([
    {
      name: "Sample Institute of Technology",
      aicteId: "1-100001",
      state: "Karnataka",
      city: "Bengaluru",
      courses: [
        { courseName: "B.E. Information Science", academicYear: "2026-27", approvedIntake: 5 },
        { courseName: "B.E. Computer Science", academicYear: "2026-27", approvedIntake: 60 },
      ],
    },
    {
      name: "Demo College of Engineering",
      aicteId: "1-100002",
      state: "Maharashtra",
      city: "Pune",
      courses: [
        { courseName: "B.E. Information Science", academicYear: "2026-27", approvedIntake: 60 },
      ],
    },
  ]);

  const hash = (p) => bcrypt.hashSync(p, 10);
  await User.insertMany([
    { name: "AICTE Admin", email: "aicte@apaar.test", password: hash("Admin@123"), role: "aicte_admin" },
    { name: "Institution Admin 1", email: "inst1@apaar.test", password: hash("Inst@123"), role: "institution_admin", institution: inst1._id },
    { name: "Institution Admin 2", email: "inst2@apaar.test", password: hash("Inst@123"), role: "institution_admin", institution: inst2._id },
    { name: "Employer Verifier", email: "verifier@apaar.test", password: hash("Verify@123"), role: "verifier" },
    { name: "Aarav Sharma", email: "student@apaar.test", password: hash("Student@123"), role: "student", apaarId: "100000000001" },
  ]);

  console.log("Seed complete.");
  console.log("Logins (demo only):");
  console.log("  aicte@apaar.test     / Admin@123");
  console.log("  inst1@apaar.test     / Inst@123");
  console.log("  inst2@apaar.test     / Inst@123");
  console.log("  verifier@apaar.test  / Verify@123");
  console.log("  student@apaar.test   / Student@123");
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});