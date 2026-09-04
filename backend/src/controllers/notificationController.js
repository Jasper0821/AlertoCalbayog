const Notification = require("../models/Notification");
const EmergencyReport = require("../models/EmergencyReport");
const User = require("../models/User");

const buildRecipientFilter = (user) => {
  if (!user) return { _id: null };
  const userId = user.id || user._id;
  const filters = [];

  if (userId) {
    filters.push({ userId });
  }

  if (user.role === "admin") {
    filters.push({ recipientRole: "admin", userId: null }, { recipientRole: "all", userId: null });
  } else if (user.role === "responder" || user.role === "staff") {
    filters.push({ recipientRole: user.role, userId: null }, { recipientRole: "all", userId: null });
  } else {
    // For regular residents: only show notifications addressed to their specific userId, OR general broadcasts where userId is null
    filters.push({ recipientRole: "resident", userId: null }, { recipientRole: "all", userId: null });
  }

  return filters.length > 0 ? { $or: filters } : {};
};

// GET /api/notifications/me — all notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, unread, search, category, startDate, endDate } = req.query;
    const recipientFilter = buildRecipientFilter(req.user);
    const filter = { ...recipientFilter };

    if (unread === "true") {
      filter.read = false;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    let finalQuery = filter;
    if (search && typeof search === "string" && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");
      finalQuery = {
        $and: [
          filter,
          {
            $or: [
              { title: regex },
              { message: regex },
              { category: regex },
              { type: regex },
            ],
          },
        ],
      };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);

    const total = await Notification.countDocuments(finalQuery).catch((err) => {
      console.error("Count docs error in notifications:", err);
      return 0;
    });

    const notifications = await Notification.find(finalQuery)
      .populate("reportId", "resolutionEvidence proofPhotos status emergencyType")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .allowDiskUse(true)
      .lean()
      .catch((err) => {
        console.error("Find docs error in notifications:", err);
        return [];
      });

    res.json({
      notifications: notifications || [],
      total: total || 0,
      page: pageNum,
      pages: Math.ceil((total || 0) / limitNum) || 1,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    res.json({ notifications: [], total: 0, page: 1, pages: 1 });
  }
};

// GET /api/notifications/unread-count — count of unread notifications
exports.getUnreadCount = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter.read = false;

    const count = await Notification.countDocuments(filter).catch(() => 0);

    res.json({ count });
  } catch (error) {
    res.json({ count: 0 });
  }
};

// PUT /api/notifications/:id/read — mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter._id = req.params.id;

    const notification = await Notification.findOneAndUpdate(filter, { read: true }, { new: true });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to mark as read" });
  }
};

// PUT /api/notifications/:id/unread — mark one notification as unread
exports.markAsUnread = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter._id = req.params.id;

    const notification = await Notification.findOneAndUpdate(filter, { read: false }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to mark as unread" });
  }
};

// PUT /api/notifications/read-all — mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter.read = false;

    await Notification.updateMany(filter, { read: true });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to mark all as read" });
  }
};

// DELETE /api/notifications/:id — delete a single notification
exports.deleteNotification = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter._id = req.params.id;

    const notification = await Notification.findOneAndDelete(filter);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to delete notification" });
  }
};

// DELETE /api/notifications/delete-all — delete all notifications for the logged-in user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);

    const result = await Notification.deleteMany(filter);

    res.json({ message: "All notifications deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to delete all notifications" });
  }
};
