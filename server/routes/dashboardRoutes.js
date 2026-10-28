const express = require("express");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const {
  institutionSummary,
  aicteSummary,
  getAlerts,
  resolveAlert,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/institution", protect, authorize("institution_admin"), institutionSummary);
router.get("/aicte", protect, authorize("aicte_admin"), aicteSummary);
router.get("/alerts", protect, authorize("aicte_admin", "institution_admin"), getAlerts);
router.patch("/alerts/:id/resolve", protect, authorize("aicte_admin"), resolveAlert);

module.exports = router;