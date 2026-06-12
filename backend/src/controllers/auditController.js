const AuditLog = require("../models/AuditLog");

// Helper to get client IP
function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    ""
  );
}

// POST /api/audit — create a log entry (called internally or from frontend via auth)
exports.createLog = async (req, res) => {
  try {
    const { category, action, actorId, actorName, actorEmail, actorRole, otpCode, otpVerifiedAt, details } = req.body;
    const log = await AuditLog.create({
      category,
      action,
      actorId: actorId || null,
      actorName: actorName || "System",
      actorEmail: actorEmail || "",
      actorRole: actorRole || "",
      otpCode: otpCode || "",
      otpVerifiedAt: otpVerifiedAt || null,
      details: details || "",
      ipAddress: getIp(req),
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/audit — fetch all logs for admin
exports.getLogs = async (req, res) => {
  try {
    const { category, search, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    let query = AuditLog.find(filter).sort({ createdAt: -1 });

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { actorName: regex },
        { actorEmail: regex },
        { action: regex },
        { details: regex },
      ];
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
