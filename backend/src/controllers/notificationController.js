const Notification = require("../models/Notification");

const buildRecipientFilter = (user) => {
  const filters = [{ userId: user.id }];
  if (user.role === "admin") {
    filters.push({ recipientRole: "admin" }, { recipientRole: "all" });
  } else {
    filters.push({ recipientRole: user.role }, { recipientRole: "all" });
  }
  return { $or: filters };
};

// GET /api/notifications/me — all notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, unread, search, category, startDate, endDate } = req.query;
    const filter = buildRecipientFilter(req.user);

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
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { message: regex },
        { category: regex },
        { type: regex },
      ].concat(filter.$or || []);
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ notifications, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
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
