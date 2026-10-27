const mongoose = require("mongoose");
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

/*
 * Residents share broadcast notifications (userId null, addressed to "resident" or
 * "all") with every other resident, so their read/deleted state is kept per person
 * in `readBy` / `hiddenFor` instead of on the shared `read` flag. Before this, one
 * resident reading or deleting an advisory did it for everyone, and "Delete all"
 * on any phone wiped every broadcast for the whole city. Staff roles keep the
 * shared flag, which their dashboards rely on.
 */
const isResident = (user) => Boolean(user) && !["admin", "responder", "staff"].includes(user.role);
const residentId = (user) => new mongoose.Types.ObjectId(String(user.id || user._id));

const residentBroadcast = (uid) => ({
  userId: null,
  recipientRole: { $in: ["resident", "all"] },
  hiddenFor: { $ne: uid },
});
const residentVisible = (uid) => ({ $or: [{ userId: uid }, residentBroadcast(uid)] });
const residentUnread = (uid) => ({
  $or: [{ userId: uid, read: false }, { ...residentBroadcast(uid), readBy: { $ne: uid } }],
});

/** Gives a broadcast this resident's own read flag and drops the per-user lists. */
const shapeForResident = (notification, uid) => {
  const shaped = { ...notification };
  if (!shaped.userId) {
    shaped.read = (shaped.readBy || []).some((id) => String(id) === String(uid));
  }
  delete shaped.readBy;
  delete shaped.hiddenFor;
  return shaped;
};

// GET /api/notifications/me — all notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, unread, search, category, startDate, endDate } = req.query;
    const resident = isResident(req.user);
    const uid = resident ? residentId(req.user) : null;
    const recipientFilter = resident ? residentVisible(uid) : buildRecipientFilter(req.user);
    const filter = { ...recipientFilter };

    if (unread === "true") {
      if (resident) filter.$and = [residentUnread(uid)];
      else filter.read = false;
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

    const found = await Notification.find(finalQuery)
      .select("-hiddenFor")
      // Photos are deliberately excluded. This was the only list endpoint that
      // opted INTO them, and at 50 rows per page it could return hundreds of
      // megabytes. Clients load evidence per-report via GET /emergency/:id.
      .populate("reportId", "status emergencyType createdAt resolvedAt assignedAgency")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .allowDiskUse(true)
      .lean()
      .catch((err) => {
        console.error("Find docs error in notifications:", err);
        return [];
      });
    const notifications = resident ? found.map((n) => shapeForResident(n, uid)) : found;

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
    const filter = isResident(req.user)
      ? residentUnread(residentId(req.user))
      : { ...buildRecipientFilter(req.user), read: false };

    const count = await Notification.countDocuments(filter).catch(() => 0);

    res.json({ count });
  } catch (error) {
    res.json({ count: 0 });
  }
};

/**
 * Sets one notification read or unread. For a resident, a broadcast is marked in
 * readBy for that resident only; their own notifications use the read flag.
 */
const setReadState = async (req, res, read) => {
  try {
    if (isResident(req.user)) {
      const uid = residentId(req.user);
      const notification = await Notification.findOne({ _id: req.params.id, ...residentVisible(uid) });
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if (notification.userId) {
        notification.read = read;
        await notification.save();
      } else {
        await Notification.updateOne(
          { _id: notification._id },
          read ? { $addToSet: { readBy: uid } } : { $pull: { readBy: uid } }
        );
      }
      return res.json(shapeForResident({ ...notification.toObject(), read }, uid));
    }

    const filter = buildRecipientFilter(req.user);
    filter._id = req.params.id;
    const notification = await Notification.findOneAndUpdate(filter, { read }, { returnDocument: "after" });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message || `Failed to mark as ${read ? "read" : "unread"}` });
  }
};

// PUT /api/notifications/:id/read — mark one notification as read
exports.markAsRead = (req, res) => setReadState(req, res, true);

// PUT /api/notifications/:id/unread — mark one notification as unread
exports.markAsUnread = (req, res) => setReadState(req, res, false);

// PUT /api/notifications/read-all — mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    if (isResident(req.user)) {
      const uid = residentId(req.user);
      await Notification.updateMany({ userId: uid, read: false }, { read: true });
      await Notification.updateMany(
        { ...residentBroadcast(uid), readBy: { $ne: uid } },
        { $addToSet: { readBy: uid } }
      );
    } else {
      const filter = buildRecipientFilter(req.user);
      filter.read = false;
      await Notification.updateMany(filter, { read: true });
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to mark all as read" });
  }
};

// DELETE /api/notifications/:id — delete a single notification. Never touches the report.
exports.deleteNotification = async (req, res) => {
  try {
    if (isResident(req.user)) {
      const uid = residentId(req.user);
      const notification = await Notification.findOne({ _id: req.params.id, ...residentVisible(uid) });
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      // A broadcast is only hidden for this resident; everyone else still sees it.
      if (notification.userId) await notification.deleteOne();
      else await Notification.updateOne({ _id: notification._id }, { $addToSet: { hiddenFor: uid } });
      return res.json({ message: "Notification deleted successfully" });
    }

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
    if (isResident(req.user)) {
      const uid = residentId(req.user);
      const result = await Notification.deleteMany({ userId: uid });
      await Notification.updateMany(residentBroadcast(uid), { $addToSet: { hiddenFor: uid } });
      return res.json({ message: "All notifications deleted successfully", deletedCount: result.deletedCount });
    }

    const filter = buildRecipientFilter(req.user);
    const result = await Notification.deleteMany(filter);
    res.json({ message: "All notifications deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to delete all notifications" });
  }
};
