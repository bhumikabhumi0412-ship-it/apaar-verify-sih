const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");
const Institution = require("../models/Institution");
const Student = require("../models/Student");
const { logAction } = require("../middleware/audit");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toInt = (v, def, max) => Math.min(Math.max(parseInt(v, 10) || def, 1), max);
const istDay = (d) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const overview = async (req, res) => {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [institutions, students, consented, verifications, daily] = await Promise.all([
        Institution.countDocuments(),
        Student.countDocuments(),
        Student.countDocuments({ consentGiven: true }),
        AuditLog.countDocuments({ action: "VERIFY_RECORD" }),
        AuditLog.aggregate([
            { $match: { action: "VERIFY_RECORD", createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    const byDay = Object.fromEntries(daily.map((d) => [d._id, d.count]));
    const verificationsByDay = [];
    for (let i = 13; i >= 0; i--) {
        const day = istDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
        verificationsByDay.push({ day, count: byDay[day] || 0 });
    }

    res.json({ institutions, students, consented, verifications, verificationsByDay });
};

const getAuditLogs = async (req, res) => {
    const page = toInt(req.query.page, 1, 100000);
    const limit = toInt(req.query.limit, 20, 100);
    const filter = {};

    if (req.query.action) filter.action = String(req.query.action);
    if (req.query.q) filter.details = { $regex: escapeRegex(req.query.q), $options: "i" };

    const range = {};
    if (req.query.from) {
        const d = new Date(`${req.query.from}T00:00:00+05:30`);
        if (!isNaN(d)) range.$gte = d;
    }
    if (req.query.to) {
        const d = new Date(`${req.query.to}T23:59:59.999+05:30`);
        if (!isNaN(d)) range.$lte = d;
    }
    if (Object.keys(range).length) filter.createdAt = range;

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

const buildStudentFilter = (q) => {
    const filter = {};
    if (q.institution && mongoose.isValidObjectId(q.institution)) filter.institution = q.institution;
    if (["active", "dropped", "graduated"].includes(q.status)) filter.status = q.status;
    if (q.consent === "true") filter.consentGiven = true;
    if (q.consent === "false") filter.consentGiven = false;
    if (q.q) {
        const rx = { $regex: escapeRegex(q.q), $options: "i" };
        filter.$or = [{ name: rx }, { apaarId: rx }, { studentId: rx }, { course: rx }];
    }
    return filter;
};

const getStudents = async (req, res) => {
    const page = toInt(req.query.page, 1, 100000);
    const limit = toInt(req.query.limit, 20, 100);
    const filter = buildStudentFilter(req.query);

    const [students, total] = await Promise.all([
        Student.find(filter)
            .select("-signature")
            .populate("institution", "name aicteId state")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Student.countDocuments(filter),
    ]);

    res.json({ students, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

// Cells starting with = + - @ can run as formulas in Excel, so neutralise them
const csvCell = (v) => {
    let s = v === undefined || v === null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
};

const exportStudents = async (req, res) => {
    const filter = buildStudentFilter(req.query);
    const students = await Student.find(filter)
        .select("-signature")
        .populate("institution", "name")
        .sort({ createdAt: -1 })
        .limit(10000)
        .lean();

    const header = ["APAAR ID", "Name", "Institution", "Course", "Academic Year", "Category", "Status", "Consent"];
    const lines = students.map((s) =>
        [
            s.apaarId,
            s.name,
            s.institution?.name,
            s.course,
            s.academicYear,
            s.category,
            s.status,
            s.consentGiven ? "Yes" : "No",
        ]
            .map(csvCell)
            .join(",")
    );

    await logAction(req, "EXPORT_STUDENTS", `${students.length} rows`);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="students.csv"');
    res.send("\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\r\n"));
};

const listInstitutions = async (req, res) => {
    const institutions = await Institution.find().select("name").sort({ name: 1 }).lean();
    res.json(institutions);
};

module.exports = { overview, getAuditLogs, getStudents, exportStudents, listInstitutions };