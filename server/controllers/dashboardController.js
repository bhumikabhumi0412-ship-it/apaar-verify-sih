const Institution = require("../models/Institution");
const Student = require("../models/Student");
const Alert = require("../models/Alert");
const { buildInstitutionStats } = require("../services/anomalyService");
const { logAction } = require("../middleware/audit");

const studentAgg = (match = {}) =>
  Student.aggregate([
    { $match: { status: "active", ...match } },
    {
      $group: {
        _id: { institution: "$institution", course: "$course", academicYear: "$academicYear" },
        enrolled: { $sum: { $cond: ["$isSupernumerary", 0, 1] } },
        supernumerary: { $sum: { $cond: ["$isSupernumerary", 1, 0] } },
        nri: { $sum: { $cond: ["$isNRI", 1, 0] } },
        oci: { $sum: { $cond: ["$ociStatus", 1, 0] } },
        fn: { $sum: { $cond: ["$isForeignNational", 1, 0] } },
      },
    },
  ]);

const alertAgg = (match = {}) =>
  Alert.aggregate([
    { $match: { status: "open", ...match } },
    { $group: { _id: { institution: "$institution", severity: "$severity" }, count: { $sum: 1 } } },
  ]);

// Institution admin: own intake vs enrolment, alerts, risk
const institutionSummary = async (req, res) => {
  const inst = await Institution.findById(req.user.institution).lean();
  if (!inst) return res.status(400).json({ message: "No institution linked to this user" });

  const [rows, alerts] = await Promise.all([
    studentAgg({ institution: inst._id }),
    alertAgg({ institution: inst._id }),
  ]);
  const stats = buildInstitutionStats([inst], rows, alerts)[0];
  const recentAlerts = await Alert.find({ institution: inst._id, status: "open" })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ ...stats, recentAlerts });
};

// AICTE admin: national view
const aicteSummary = async (req, res) => {
  const institutions = await Institution.find().lean();
  const [rows, alerts, alertsByType] = await Promise.all([
    studentAgg(),
    alertAgg(),
    Alert.aggregate([
      { $match: { status: "open" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);

  const stats = buildInstitutionStats(institutions, rows, alerts);

  const totals = stats.reduce(
    (t, s) => {
      s.courses.forEach((c) => {
        t.approvedIntake += c.approvedIntake;
        t.enrolled += c.enrolled;
        t.supernumerary += c.supernumerary;
      });
      return t;
    },
    { institutions: stats.length, approvedIntake: 0, enrolled: 0, supernumerary: 0 }
  );

  const stateWise = {};
  stats.forEach((s) => {
    stateWise[s.state] = stateWise[s.state] || { state: s.state, institutions: 0, enrolled: 0 };
    stateWise[s.state].institutions += 1;
    s.courses.forEach((c) => (stateWise[s.state].enrolled += c.total));
  });

  res.json({
    totals,
    openAlertsByType: Object.fromEntries(alertsByType.map((a) => [a._id, a.count])),
    stateWise: Object.values(stateWise),
    institutions: stats.sort((a, b) => b.risk.score - a.risk.score), // riskiest first
  });
};

const getAlerts = async (req, res) => {
  const filter = { status: req.query.status || "open" };
  if (req.user.role === "institution_admin") filter.institution = req.user.institution;

  const alerts = await Alert.find(filter)
    .populate("institution", "name aicteId")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ count: alerts.length, alerts });
};

const resolveAlert = async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { status: "resolved" }, { new: true });
  if (!alert) return res.status(404).json({ message: "Alert not found" });
  await logAction(req, "RESOLVE_ALERT", String(alert._id));
  res.json(alert);
};

module.exports = { institutionSummary, aicteSummary, getAlerts, resolveAlert };