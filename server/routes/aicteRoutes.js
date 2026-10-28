const express = require("express");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const {
    overview,
    getAuditLogs,
    getStudents,
    exportStudents,
    listInstitutions,
} = require("../controllers/aicteController");

const router = express.Router();

// Every route here is AICTE-only. The audit log is read-only by design: no write routes exist.
router.use(protect, authorize("aicte_admin"));

router.get("/overview", overview);
router.get("/audit", getAuditLogs);
router.get("/students", getStudents);
router.get("/students/export", exportStudents);
router.get("/institutions", listInstitutions);

module.exports = router;