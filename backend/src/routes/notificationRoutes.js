const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead, markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.put("/read-all", authMiddleware, markAllAsRead);
router.put("/:id/read", authMiddleware, markAsRead);
router.put("/:id/unread", authMiddleware, markAsUnread);
router.delete("/delete-all", authMiddleware, deleteAllNotifications);
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;

