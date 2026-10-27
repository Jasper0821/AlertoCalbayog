/**
 * Plain-language wording for what happened to a resident's report. Every
 * notification sent to a resident takes its title and message from here, so the
 * in-app list and any push notification read the same. The mobile app's
 * src/constants/reportStatus.ts mirrors these titles for older notifications.
 */
const REPORT_STATUS_COPY = {
  pending: {
    title: "Your report was received",
    message: "Dispatch has your report and location. A team is being assigned.",
  },
  responding: {
    title: "Responders are on the way",
    message: "Responders are heading to your location. Keep your phone nearby.",
  },
  resolved: {
    title: "Your report is resolved",
    message: "Responders finished at the scene and shared photos of what they did.",
  },
  closed: {
    title: "Your report is closed",
    message: "This report is closed. Thank you for reporting.",
  },
  rejected: {
    title: "Your report was not accepted",
    message: "Dispatch could not accept this report. Call the hotline if you still need help.",
  },
  cancelled: {
    title: "You cancelled this report",
    message: "This report was withdrawn and responders were told.",
  },
};

const ASSIGNED_TITLE = "A responder is assigned";

const statusTitle = (status) => REPORT_STATUS_COPY[status]?.title || "Your report was updated";
const statusMessage = (status) =>
  REPORT_STATUS_COPY[status]?.message || `Your report status is now ${status}.`;

module.exports = { REPORT_STATUS_COPY, ASSIGNED_TITLE, statusTitle, statusMessage };
