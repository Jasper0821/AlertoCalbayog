const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const {
  isConfigured,
  VOTER_ID_FOLDER,
  signVoterIdUpload,
  voterIdViewUrl,
  deleteVoterIdImages,
  deleteVoterIdImagesById,
} = require("../utils/cloudinary");

/**
 * Voter's ID verification. A resident photographs their Voter's ID (or Voter's
 * Certification) and takes a selfie holding it; an administrator compares both with
 * the account and approves or rejects. Approval gives the "Verified resident" tag
 * responders see on reports. It is optional and never blocks sign-up or reporting.
 *
 * The phone uploads the photos straight to Cloudinary as private assets. They are
 * deleted as soon as the request is reviewed or withdrawn; only the outcome is kept.
 */

const DOCUMENT_TYPES = {
  voters_id: "Voter's ID",
  voters_certification: "Voter's Certification",
};
const SIDES = ["front", "selfie"];
const MAX_REASON_LENGTH = 300;
const LINK_LIFETIME_MS = 10 * 60 * 1000;

const UNAVAILABLE = "Voter's ID upload isn't available right now. Please try again later.";

const emptyReview = () => ({
  status: "",
  documentType: "",
  frontPublicId: "",
  selfiePublicId: "",
  submittedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  reviewedByName: "",
  rejectionReason: "",
});

/** What a resident's app may see about their own request: never the photos. */
const publicReview = (review) => ({
  status: review?.status || "",
  documentType: review?.documentType || "",
  submittedAt: review?.submittedAt || null,
  reviewedAt: review?.reviewedAt || null,
  rejectionReason: review?.rejectionReason || "",
});

/** True when `publicId` is a photo this resident was given a signature to upload. */
const isOwnPhoto = (publicId, userId, side) =>
  typeof publicId === "string" &&
  new RegExp(`^${VOTER_ID_FOLDER}/${userId}/${side}-[a-f0-9]{16}$`).test(publicId);

const audit = (action, actor, details) =>
  AuditLog.create({
    category: "user_activity",
    action,
    actorId: actor?._id || null,
    actorName: actor?.fullName || "Admin",
    actorRole: actor?.role || "",
    details,
  }).catch((err) => console.warn(`Voter's ID audit log (${action}) failed:`, err.message));

const notify = async (io, room, fields) => {
  try {
    const notification = await Notification.create({ category: "user_event", type: "user_event", ...fields });
    io?.to(room).emit("notification", notification);
  } catch (err) {
    console.warn("Voter's ID notification failed:", err.message);
  }
};

const loadAdmin = (req) => User.findById(req.user.id).select("fullName role");

// GET /api/voter-id/requirements — public, so the app knows whether to offer the upload.
exports.getRequirements = (req, res) => {
  res.json({ available: isConfigured });
};

/**
 * GET /api/voter-id/upload-signature?side=front|selfie — resident. Signs one upload
 * for a public_id the server chooses inside the resident's own folder.
 */
exports.getUploadSignature = async (req, res) => {
  try {
    const { side } = req.query;
    if (!SIDES.includes(side)) {
      return res.status(400).json({ message: "side must be front or selfie." });
    }
    if (!isConfigured) return res.status(503).json({ message: UNAVAILABLE });

    const user = await User.findById(req.user.id).select("residentVerificationStatus");
    if (!user) return res.status(404).json({ message: "Account not found." });
    if (user.residentVerificationStatus === "verified") {
      return res.status(409).json({ message: "Your account is already verified." });
    }

    res.json(signVoterIdUpload(String(user._id), side));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/voter-id — resident sends the two photos they just uploaded for review.
exports.submit = async (req, res) => {
  try {
    if (!isConfigured) return res.status(503).json({ message: UNAVAILABLE });

    const { documentType, frontPublicId, selfiePublicId } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Account not found." });
    const userId = String(user._id);

    if (!DOCUMENT_TYPES[documentType]) {
      return res.status(400).json({ message: "Choose Voter's ID or Voter's Certification." });
    }
    if (!isOwnPhoto(frontPublicId, userId, "front") || !isOwnPhoto(selfiePublicId, userId, "selfie")) {
      return res.status(400).json({ message: "Take a photo of your ID and a selfie holding it, then send them again." });
    }

    if (user.residentVerificationStatus === "verified") {
      await deleteVoterIdImagesById([frontPublicId, selfiePublicId]);
      return res.status(409).json({
        message: "Your account is already verified.",
        review: publicReview(user.voterIdReview),
      });
    }

    // A new submission replaces any earlier one, whose photos are no longer needed.
    const replaced = [user.voterIdReview?.frontPublicId, user.voterIdReview?.selfiePublicId].filter(
      (id) => id && id !== frontPublicId && id !== selfiePublicId
    );

    const review = {
      ...emptyReview(),
      status: "pending",
      documentType,
      frontPublicId,
      selfiePublicId,
      submittedAt: new Date(),
    };
    await User.updateOne({ _id: user._id }, { $set: { voterIdReview: review } }, { runValidators: true });
    await deleteVoterIdImagesById(replaced);

    await notify(req.app.get("io"), "admin", {
      recipientRole: "admin",
      title: "Voter's ID to review",
      message: `${user.fullName} sent a ${DOCUMENT_TYPES[documentType]} to verify their account. Review it under Voter's ID Review.`,
      metadata: { userId, voterIdReview: "pending" },
    });
    audit("voter_id_submitted", user, `${user.fullName} sent a ${DOCUMENT_TYPES[documentType]} for verification.`);

    res.status(201).json({
      message: "Your Voter's ID was sent. The City will review it and notify you.",
      review: publicReview(review),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/voter-id/me — resident withdraws a request still waiting for review.
exports.withdraw = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, "voterIdReview.status": "pending" },
      { $set: { voterIdReview: emptyReview() } },
      { returnDocument: "after" }
    );
    if (!user) return res.status(404).json({ message: "You have no Voter's ID waiting for review." });

    await deleteVoterIdImages(String(user._id));
    audit("voter_id_withdrawn", user, `${user.fullName} cancelled their Voter's ID request.`);

    res.json({
      message: "Your request was cancelled and the photos deleted.",
      review: publicReview(user.voterIdReview),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/voter-id/requests?status=pending|reviewed — admin. Pending requests come
 * oldest first with 10-minute photo links; reviewed ones are the latest decisions,
 * whose photos are already deleted.
 */
exports.listRequests = async (req, res) => {
  try {
    if (req.query.status === "reviewed") {
      const users = await User.find({ "voterIdReview.status": { $in: ["approved", "rejected"] } })
        .select("fullName barangay voterIdReview")
        .sort({ "voterIdReview.reviewedAt": -1 })
        .limit(50)
        .lean();
      return res.json({
        requests: users.map((u) => ({
          userId: u._id,
          fullName: u.fullName,
          barangay: u.barangay || "",
          documentType: u.voterIdReview.documentType,
          status: u.voterIdReview.status,
          submittedAt: u.voterIdReview.submittedAt,
          reviewedAt: u.voterIdReview.reviewedAt,
          reviewedByName: u.voterIdReview.reviewedByName,
          rejectionReason: u.voterIdReview.rejectionReason,
        })),
      });
    }

    const users = await User.find({ "voterIdReview.status": "pending" })
      .select("fullName email phoneNumber mobileNumber barangay completeAddress createdAt voterIdReview")
      .sort({ "voterIdReview.submittedAt": 1 })
      .limit(100)
      .lean();
    res.json({
      linksExpireAt: new Date(Date.now() + LINK_LIFETIME_MS),
      requests: users.map((u) => ({
        userId: u._id,
        fullName: u.fullName,
        email: u.email || "",
        phoneNumber: u.phoneNumber || u.mobileNumber || "",
        barangay: u.barangay || "",
        completeAddress: u.completeAddress || "",
        accountCreatedAt: u.createdAt,
        documentType: u.voterIdReview.documentType,
        submittedAt: u.voterIdReview.submittedAt,
        frontUrl: voterIdViewUrl(u.voterIdReview.frontPublicId),
        selfieUrl: voterIdViewUrl(u.voterIdReview.selfiePublicId),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Records an admin's decision on a pending request. The filter on status makes it
 * atomic: two admins acting on the same request can't both decide it.
 */
const decide = async (req, res, { approve, reason }) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ message: "Invalid request." });
  }

  const admin = await loadAdmin(req);
  const now = new Date();
  const updates = {
    "voterIdReview.status": approve ? "approved" : "rejected",
    "voterIdReview.reviewedAt": now,
    "voterIdReview.reviewedBy": admin?._id || req.user.id,
    "voterIdReview.reviewedByName": admin?.fullName || "Admin",
    "voterIdReview.rejectionReason": approve ? "" : reason,
    "voterIdReview.frontPublicId": "",
    "voterIdReview.selfiePublicId": "",
  };
  if (approve) {
    Object.assign(updates, {
      residentVerificationStatus: "verified",
      verifiedAt: now,
      verificationMethod: "voters_id",
    });
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.userId, "voterIdReview.status": "pending" },
    { $set: updates },
    { returnDocument: "after", runValidators: true }
  );
  if (!user) {
    return res.status(404).json({ message: "This request was already reviewed or withdrawn." });
  }

  const userId = String(user._id);
  await deleteVoterIdImages(userId);

  const documentName = DOCUMENT_TYPES[user.voterIdReview.documentType] || "Voter's ID";
  await notify(req.app.get("io"), userId, approve
    ? {
        userId: user._id,
        recipientRole: "resident",
        title: "You're a verified resident",
        message: `The City confirmed your ${documentName}. Responders will now see you as a verified resident of Calbayog.`,
        metadata: { voterIdReview: "approved" },
      }
    : {
        userId: user._id,
        recipientRole: "resident",
        title: `${documentName} not accepted`,
        message: `${/[.!?]$/.test(reason) ? reason : `${reason}.`} You can send new photos from your Profile.`,
        metadata: { voterIdReview: "rejected" },
      });
  audit(
    approve ? "voter_id_approved" : "voter_id_rejected",
    admin,
    approve
      ? `${admin?.fullName || "Admin"} approved the ${documentName} of ${user.fullName}.`
      : `${admin?.fullName || "Admin"} rejected the ${documentName} of ${user.fullName}: ${reason}`
  );

  res.json({
    message: approve ? `${user.fullName} is now a verified resident.` : `${user.fullName}'s request was rejected.`,
    user: {
      _id: user._id,
      residentVerificationStatus: user.residentVerificationStatus,
      verificationMethod: user.verificationMethod,
      verifiedAt: user.verifiedAt,
      voterIdReview: publicReview(user.voterIdReview),
    },
  });
};

// POST /api/voter-id/requests/:userId/approve — admin.
exports.approve = async (req, res) => {
  try {
    await decide(req, res, { approve: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/voter-id/requests/:userId/reject — admin; the reason is shown to the resident.
exports.reject = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Give the resident a reason." });
    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({ message: `Keep the reason under ${MAX_REASON_LENGTH} characters.` });
    }
    await decide(req, res, { approve: false, reason });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
