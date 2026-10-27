const VoterRecord = require("../models/VoterRecord");
const VoterListImport = require("../models/VoterListImport");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const { voterMatchKey, isVoterMatchingConfigured } = require("./voterMatch");

/**
 * Checks a resident against the City's voters list and, on a match, marks them a
 * verified resident. Never blocks anything: a resident who is not found keeps a
 * normal account and can still report.
 *
 * Result statuses:
 *   verified    - matched (or was already verified)
 *   not_found   - no voter with these details in this barangay
 *   claimed     - matched a voter another account already verified with; flagged for review
 *   incomplete  - a required field (name, barangay, birthdate when needed) is missing
 *   unavailable - no voters list has been loaded, or the server is not configured
 *
 * Responses never include any voter data, so the check can't be used to look people up.
 */
async function verifyResidentAsVoter(user, fields = {}, io = null) {
  if (user.residentVerificationStatus === "verified") {
    return { status: "verified", message: "Your account is already verified." };
  }

  const latest = isVoterMatchingConfigured()
    ? await VoterListImport.findOne().sort({ importedAt: -1 }).lean()
    : null;
  if (!latest || !latest.recordCount) {
    return { status: "unavailable", message: "Voter verification isn't available yet." };
  }

  const barangay = fields.barangay || user.barangay;
  const key = voterMatchKey({ ...fields, barangay }, latest.includesBirthdate);
  if (!key) {
    return {
      status: "incomplete",
      message: latest.includesBirthdate
        ? "Enter your last name, first name, barangay and birthdate."
        : "Enter your last name, first name and barangay.",
    };
  }

  const record = await VoterRecord.findOne({ matchKey: key });
  if (!record) {
    return {
      status: "not_found",
      message: "We couldn't find these details on the voters list. Check the spelling against your voter's record, or ask the admin to verify you.",
    };
  }

  // Claim atomically, so two accounts can't both take the same record.
  const claimed =
    String(record.claimedBy || "") === String(user._id)
      ? record
      : await VoterRecord.findOneAndUpdate(
          { _id: record._id, claimedBy: null },
          { claimedBy: user._id, claimedAt: new Date() },
          { returnDocument: "after" }
        );

  if (!claimed) {
    await VoterRecord.updateOne({ _id: record._id }, { $addToSet: { disputedBy: user._id } });
    try {
      const notification = await Notification.create({
        recipientRole: "admin",
        title: "Possible duplicate voter claim",
        message: `${user.fullName || "A resident"} matched a voter record another account already verified with. Review it under Voters List.`,
        category: "user_event",
        type: "user_event",
        metadata: { userId: String(user._id) },
      });
      io?.to("admin").emit("notification", notification);
    } catch (err) {
      console.warn("Duplicate voter claim notification failed:", err.message);
    }
    return {
      status: "claimed",
      message: "Another account is already verified with these details. An administrator will review it.",
    };
  }

  user.residentVerificationStatus = "verified";
  user.verifiedAt = new Date();
  user.verificationMethod = "voters_list";
  if (!user.barangay && fields.barangay) user.barangay = fields.barangay;
  await user.save();

  try {
    await AuditLog.create({
      category: "user_activity",
      action: "voter_verified",
      actorId: user._id,
      actorName: user.fullName,
      actorRole: user.role,
      details: `${user.fullName} was verified against the voters list.`,
    });
  } catch (err) {
    console.warn("Voter verification audit log failed:", err.message);
  }

  return { status: "verified", message: "You're verified as a registered voter of Calbayog." };
}

module.exports = { verifyResidentAsVoter };
