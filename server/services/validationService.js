const ApaarRegistry = require("../models/ApaarRegistry");
const Student = require("../models/Student");
const { isValidFormat } = require("./apaarService");

const REQUIRED = ["apaarId", "name", "dob", "course", "academicYear"];
const GENDERS = ["Male", "Female", "Other"];
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

const validateRows = async (rows, institution) => {
  const accepted = [];
  const rejected = [];

  // Fetch everything we need in 3 queries instead of one per row
  const ids = [
    ...new Set(rows.map((r) => String(r.apaarId || "").trim()).filter(isValidFormat)),
  ];
  const registry = await ApaarRegistry.find({ apaarId: { $in: ids } }).lean();
  const registryMap = new Map(registry.map((r) => [r.apaarId, r]));
  const existing = await Student.find({ apaarId: { $in: ids } }).lean();

  // Current non-supernumerary enrolment per course + year for this institution
  const enrolled = await Student.find({
    institution: institution._id,
    status: "active",
    isSupernumerary: false,
  })
    .select("course academicYear")
    .lean();
  const counts = {};
  enrolled.forEach((s) => {
    const k = `${s.course}|${s.academicYear}`;
    counts[k] = (counts[k] || 0) + 1;
  });

  const seen = new Set(); // duplicates inside the same file

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 2; // line 1 is the header
    const apaarId = String(r.apaarId || "").trim();

    const reject = (type, message, severity = "medium") =>
      rejected.push({ line, apaarId, type, message, severity });

    // 1. APAAR ID missing or wrong format
    if (!isValidFormat(apaarId)) {
      reject("INVALID_APAAR", "APAAR ID is missing or not a 12-digit number");
      continue;
    }

    // 2. Other required fields
    const missing = REQUIRED.filter((f) => !String(r[f] || "").trim());
    if (missing.length) {
      reject("DATA_INCONSISTENCY", `Missing required field(s): ${missing.join(", ")}`);
      continue;
    }

    // 3. APAAR ID must exist in the registry
    const reg = registryMap.get(apaarId);
    if (!reg) {
      reject("INVALID_APAAR", "APAAR ID not found in the APAAR registry", "high");
      continue;
    }

    // 4. Name and date of birth must match the registry
    const dob = new Date(r.dob);
    if (isNaN(dob) || dob > new Date()) {
      reject("DATA_INCONSISTENCY", "Date of birth is invalid or in the future");
      continue;
    }
    if (
      norm(r.name) !== norm(reg.name) ||
      dob.toISOString().slice(0, 10) !== new Date(reg.dob).toISOString().slice(0, 10)
    ) {
      reject("DATA_INCONSISTENCY", "Name or date of birth does not match the APAAR registry");
      continue;
    }

    // 5. Course must be approved for this institution and year
    const course = institution.courses.find(
      (c) => c.courseName === r.course && c.academicYear === r.academicYear
    );
    if (!course) {
      reject(
        "DATA_INCONSISTENCY",
        `Course "${r.course}" (${r.academicYear}) is not approved for this institution`
      );
      continue;
    }

    // 6. Contradictory category flags
    if (r.isNRI && r.isForeignNational) {
      reject("DATA_INCONSISTENCY", "Student is marked both NRI and Foreign National");
      continue;
    }

    // 7. Duplicate inside the uploaded file
    const key = `${apaarId}|${r.course}`;
    if (seen.has(key)) {
      reject("DUPLICATE_RECORD", "Same student appears more than once in this file");
      continue;
    }

    // 8. Duplicate already stored for this institution and course
    const sameInst = existing.some(
      (s) => String(s.institution) === String(institution._id) && s.course === r.course
    );
    if (sameInst) {
      reject("DUPLICATE_RECORD", "Student is already registered in this course");
      continue;
    }

    // 9. Cross-institution duplicate: active elsewhere
    const elsewhere = existing.some(
      (s) => String(s.institution) !== String(institution._id) && s.status === "active"
    );
    if (elsewhere) {
      reject(
        "CROSS_INSTITUTION_DUPLICATE",
        "Student is already actively enrolled in another institution",
        "high"
      );
      continue;
    }

    // 10. Admissions must not exceed approved intake (supernumerary seats are separate)
    const ck = `${r.course}|${r.academicYear}`;
    if (!r.isSupernumerary) {
      if ((counts[ck] || 0) >= course.approvedIntake) {
        reject(
          "EXCESS_INTAKE",
          `Approved intake of ${course.approvedIntake} for ${r.course} is already full`,
          "high"
        );
        continue;
      }
      counts[ck] = (counts[ck] || 0) + 1;
    }

    seen.add(key);
    accepted.push({
      apaarId,
      name: r.name,
      dob,
      gender: GENDERS.includes(r.gender) ? r.gender : undefined,
      institution: institution._id,
      course: r.course,
      academicYear: r.academicYear,
      studentId: r.studentId,
      category: r.category,
      isSupernumerary: r.isSupernumerary,
      isNRI: r.isNRI,
      ociStatus: r.ociStatus,
      isForeignNational: r.isForeignNational,
    });
  }

  return { accepted, rejected };
};

module.exports = { validateRows };