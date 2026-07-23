const express = require("express");
const router = express.Router();
const {
  exportBackup,
  listBackups,
  downloadBackupFile,
  deleteBackupFile,
  restoreFromUpload,
  restoreFromFile,
} = require("../controllers/backupController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All backup routes require Admin privileges
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/export", exportBackup);
router.get("/list", listBackups);
router.get("/download/:filename", downloadBackupFile);
router.delete("/:filename", deleteBackupFile);
router.post("/restore/upload", restoreFromUpload);
router.post("/restore/file/:filename", restoreFromFile);

module.exports = router;
