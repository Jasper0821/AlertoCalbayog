const Notification = require("../models/Notification");
const EmergencyReport = require("../models/EmergencyReport");
const User = require("../models/User");

const buildRecipientFilter = (user) => {
  const userId = user.id || user._id;
  const filters = [{ userId }];
  if (user.role === "admin") {
    filters.push({ recipientRole: "admin", userId: null }, { recipientRole: "all", userId: null });
  } else if (user.role === "responder" || user.role === "staff") {
    filters.push({ recipientRole: user.role, userId: null }, { recipientRole: "all", userId: null });
  } else {
    // For regular residents: only show notifications addressed to their specific userId, OR general broadcasts where userId is null
    filters.push({ recipientRole: "resident", userId: null }, { recipientRole: "all", userId: null });
  }
  return { $or: filters };
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
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    let finalQuery = filter;
    if (search) {
      const regex = new RegExp(search, "i");
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

    const total = await Notification.countDocuments(finalQuery);
    const notifications = await Notification.find(finalQuery)
      .populate("reportId", "resolutionEvidence proofPhotos status emergencyType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ notifications, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/unread-count — count of unread notifications
exports.getUnreadCount = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);
    filter.read = false;

    const count = await Notification.countDocuments(filter);

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/delete-all — delete all notifications for the logged-in user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const filter = buildRecipientFilter(req.user);

    const result = await Notification.deleteMany(filter);

    res.json({ message: "All notifications deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
