const AuditLog = require("../models/AuditLog");

const logAction = async (req, action, details = "") => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      role: req.user?.role,
      action,
      details,
      ip: req.ip,
    });
  } catch (e) {
    console.error("Audit log failed:", e.message);
  }
};

module.exports = { logAction };