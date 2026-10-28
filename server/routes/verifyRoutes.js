const express = require("express");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { verifyRecord, setConsent, getQR } = require("../controllers/verifyController");

const router = express.Router();

router.patch("/consent", protect, authorize("student"), setConsent);
router.get("/:apaarId/qr", protect, authorize("institution_admin", "aicte_admin", "student"), getQR);
router.get("/:apaarId", protect, authorize("verifier", "aicte_admin"), verifyRecord);

module.exports = router;