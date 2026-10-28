const fs = require("fs");
const Institution = require("../models/Institution");
const Student = require("../models/Student");
const Alert = require("../models/Alert");
const { parseCSV } = require("../utils/csvParser");
const { validateRows } = require("../services/validationService");
const { sign } = require("../utils/hmac");
const { logAction } = require("../middleware/audit");

const uploadStudents = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please attach a CSV file (field name: file)" });
  const filePath = req.file.path;

  try {
    const institution = await Institution.findById(req.user.institution);
    if (!institution) return res.status(400).json({ message: "No institution linked to this user" });

    const rows = await parseCSV(filePath);
    if (!rows.length) return res.status(400).json({ message: "The CSV file is empty" });

    const { accepted, rejected } = await validateRows(rows, institution);

    // Sign every verified record so tampering can be detected later
    const docs = accepted.map((s) => ({
      ...s,
      signature: sign({
        apaarId: s.apaarId,
        institution: String(s.institution),
        course: s.course,
        academicYear: s.academicYear,
        name: s.name,
      }),
    }));

    if (docs.length) await Student.insertMany(docs, { ordered: false });

    if (rejected.length) {
      await Alert.insertMany(
        rejected.map((e) => ({
          type: e.type,
          severity: e.severity,
          institution: institution._id,
          apaarId: e.apaarId,
          message: `Line ${e.line}: ${e.message}`,
        }))
      );
    }

    await logAction(
      req,
      "UPLOAD_STUDENTS",
      `${rows.length} rows: ${accepted.length} accepted, ${rejected.length} rejected`
    );

    res.json({
      total: rows.length,
      accepted: accepted.length,
      rejected: rejected.length,
      errors: rejected,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  } finally {
    fs.unlink(filePath, () => {}); // delete the temp file
  }
};

const getStudents = async (req, res) => {
  const filter = {};
  if (req.user.role === "institution_admin") filter.institution = req.user.institution;
  else if (req.query.institution) filter.institution = req.query.institution;
  if (req.query.course) filter.course = req.query.course;

  const students = await Student.find(filter)
    .populate("institution", "name aicteId")
    .select("-signature")
    .sort({ createdAt: -1 })
    .limit(500);

  res.json({ count: students.length, students });
};

module.exports = { uploadStudents, getStudents };