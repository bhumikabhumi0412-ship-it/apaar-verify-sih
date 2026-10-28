const Student = require("../models/Student");
const { isValidFormat } = require("../services/apaarService");
const { signaturePayload, makeQR } = require("../services/qrService");
const { verify } = require("../utils/hmac");
const { logAction } = require("../middleware/audit");

// Employer / regulator verification with minimal disclosure
const verifyRecord = async (req, res) => {
  const { apaarId } = req.params;
  if (!isValidFormat(apaarId)) {
    return res.status(400).json({ message: "APAAR ID must be a 12-digit number" });
  }

  const records = await Student.find({ apaarId }).populate("institution", "name aicteId state");
  if (!records.length) {
    return res.status(404).json({ verified: false, message: "No enrolment record found" });
  }

  const isAicte = req.user.role === "aicte_admin";
  const visible = records.filter((r) => isAicte || r.consentGiven);

  if (!visible.length) {
    await logAction(req, "VERIFY_DENIED_NO_CONSENT", apaarId);
    return res.status(403).json({
      verified: false,
      message: "The student has not given consent to share this record",
    });
  }

  const results = visible.map((r) => ({
    institution: r.institution.name,
    course: r.course,
    academicYear: r.academicYear,
    status: r.status,
    authentic: verify(signaturePayload(r), r.signature),
    ...(isAicte && { name: r.name, studentId: r.studentId }),
  }));

  await logAction(req, "VERIFY_RECORD", apaarId);

  res.json({
    apaarId,
    verified: results.some((r) => r.authentic && r.status === "active"),
    records: results,
  });
};

// Student grants or withdraws consent for all their records
const setConsent = async (req, res) => {
  if (typeof req.body.consent !== "boolean") {
    return res.status(400).json({ message: "Send { \"consent\": true } or { \"consent\": false }" });
  }
  const result = await Student.updateMany(
    { apaarId: req.user.apaarId },
    { consentGiven: req.body.consent }
  );
  await logAction(req, req.body.consent ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN", req.user.apaarId);
  res.json({ consent: req.body.consent, recordsUpdated: result.modifiedCount });
};

// QR code (links to the verification page) for printing on certificates
const getQR = async (req, res) => {
  const { apaarId } = req.params;
  if (!isValidFormat(apaarId)) {
    return res.status(400).json({ message: "APAAR ID must be a 12-digit number" });
  }

  const filter = { apaarId };
  if (req.user.role === "institution_admin") filter.institution = req.user.institution;
  if (req.user.role === "student" && req.user.apaarId !== apaarId) {
    return res.status(403).json({ message: "You can only generate a QR for your own record" });
  }

  const record = await Student.findOne(filter);
  if (!record) return res.status(404).json({ message: "Record not found" });

  const qr = await makeQR(apaarId);
  res.json({ apaarId, studentId: record.studentId, ...qr });
};

module.exports = { verifyRecord, setConsent, getQR };