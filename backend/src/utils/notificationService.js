const Notification = require("../models/Notification");

exports.createNotification = async ({
  userId = null,
  recipientRole = "resident",
  title,
  message,
  category = "system",
  type = "system_event",
  reportId = null,
  metadata = {},
  read = false,
}) => {
  const notification = await Notification.create({
    userId,
    recipientRole,
    title,
    message,
    category,
    type,
    reportId,
    metadata,
    read,
  });
  return notification;
};
