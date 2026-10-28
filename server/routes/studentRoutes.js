const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { uploadStudents, getStudents } = require("../controllers/studentController");

const router = express.Router();

router.post("/upload", protect, authorize("institution_admin"), upload.single("file"), uploadStudents);
router.get("/", protect, authorize("institution_admin", "aicte_admin"), getStudents);

module.exports = router;