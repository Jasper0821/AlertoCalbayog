const User = require("../models/User");
const VoterRecord = require("../models/VoterRecord");
const VoterListImport = require("../models/VoterListImport");
const AuditLog = require("../models/AuditLog");
const { voterMatchKey, isVoterMatchingConfigured } = require("../utils/voterMatch");
const { verifyResidentAsVoter } = require("../utils/voterVerification");

const MAX_ROWS_PER_CHUNK = 5000;

const latestImport = () => VoterListImport.findOne().sort({ importedAt: -1 });

// GET /api/voters/requirements — public, booleans only: what the app should ask for.
exports.getRequirements = async (req, res) => {
  try {
    const latest = isVoterMatchingConfigured() ? await latestImport().lean() : null;
    res.json({
      available: Boolean(latest && latest.recordCount > 0),
      needsBirthdate: Boolean(latest?.includesBirthdate),
    });
  } catch (error) {
    res.json({ available: false, needsBirthdate: false });
  }
};

/**
 * POST /api/voters/import — admin. Receives the list in chunks parsed in the
 * admin's browser and stores only fingerprints; names never reach the database.
 * The first chunk carries `replace: true` plus the agreement details.
 */
exports.importVoters = async (req, res) => {
  try {
    if (!isVoterMatchingConfigured()) {
      return res.status(503).json({ message: "Set VOTER_MATCH_SECRET (16+ characters) on the server before importing." });
    }
    const { rows, replace, includesBirthdate, agreementReference, final } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS_PER_CHUNK) {
      return res.status(400).json({ message: `Send between 1 and ${MAX_ROWS_PER_CHUNK} rows per request.` });
    }

    const admin = await User.findById(req.user.id).select("fullName");
    if (replace) {
      const reference = String(agreementReference || "").trim();
      if (!reference) {
        return res.status(400).json({ message: "Enter the reference of the data-sharing agreement for this list." });
      }
      await VoterRecord.deleteMany({});
      await VoterListImport.create({
        importedBy: req.user.id,
        importedByName: admin?.fullName || "",
        includesBirthdate: Boolean(includesBirthdate),
        agreementReference: reference.slice(0, 200),
      });
    }

    const current = await latestImport();
    if (!current) {
      return res.status(400).json({ message: "Start a new import first." });
    }

    let skipped = 0;
    const docs = [];
    const seen = new Set();
    for (const row of rows) {
      const key = voterMatchKey(row || {}, current.includesBirthdate);
      if (!key) {
        skipped += 1;
      } else if (!seen.has(key)) {
        seen.add(key);
        docs.push({ matchKey: key });
      }
    }

    let inserted = 0;
    if (docs.length) {
      try {
        const result = await VoterRecord.insertMany(docs, { ordered: false });
        inserted = result.length;
      } catch (err) {
        // Duplicate keys (the same person listed twice) are skipped, not fatal.
        const duplicateOnly = err.code === 11000 || (err.writeErrors || []).every((e) => (e.code ?? e.err?.code) === 11000);
        if (!duplicateOnly) throw err;
        inserted = err.insertedDocs?.length ?? err.result?.insertedCount ?? 0;
      }
    }

    current.recordCount += inserted;
    await current.save();

    if (final) {
      await AuditLog.create({
        category: "user_activity",
        action: "voters_list_import",
        actorId: req.user.id,
        actorName: admin?.fullName || "Admin",
        actorRole: req.user.role,
        details: `Voters list loaded: ${current.recordCount} records (agreement: ${current.agreementReference}).`,
      });
    }

    // Rows not stored are either incomplete (skipped) or the same person twice.
    res.json({ inserted, skipped, duplicates: rows.length - skipped - inserted, total: current.recordCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/voters/status — admin.
exports.getStatus = async (req, res) => {
  try {
    const latest = await latestImport().lean();
    const [records, verifiedResidents, disputes] = await Promise.all([
      VoterRecord.estimatedDocumentCount(),
      User.countDocuments({ residentVerificationStatus: "verified", verificationMethod: "voters_list" }),
      VoterRecord.find({ "disputedBy.0": { $exists: true } })
        .populate("claimedBy", "fullName phoneNumber barangay")
        .populate("disputedBy", "fullName phoneNumber barangay")
        .limit(50)
        .lean(),
    ]);
    res.json({
      configured: isVoterMatchingConfigured(),
      records,
      lastImport: latest
        ? {
            importedAt: latest.importedAt,
            importedByName: latest.importedByName,
            agreementReference: latest.agreementReference,
            includesBirthdate: latest.includesBirthdate,
          }
        : null,
      verifiedResidents,
      disputes: disputes.map((d) => ({
        id: d._id,
        claimedBy: d.claimedBy,
        claimedAt: d.claimedAt,
        disputedBy: d.disputedBy || [],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/voters/disputes/:id/resolve — admin: mark a duplicate claim as reviewed.
exports.resolveDispute = async (req, res) => {
  try {
    await VoterRecord.updateOne({ _id: req.params.id }, { $unset: { disputedBy: 1 } });
    res.json({ message: "Marked as reviewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/voters — admin. Removes the whole list, e.g. when the agreement ends.
 * Residents already verified stay verified: they were checked while it was valid.
 */
exports.deleteVoters = async (req, res) => {
  try {
    const { deletedCount } = await VoterRecord.deleteMany({});
    await VoterListImport.deleteMany({});
    const admin = await User.findById(req.user.id).select("fullName");
    await AuditLog.create({
      category: "user_activity",
      action: "voters_list_deleted",
      actorId: req.user.id,
      actorName: admin?.fullName || "Admin",
      actorRole: req.user.role,
      details: `Voters list deleted (${deletedCount} records).`,
    });
    res.json({ message: "Voters list deleted", deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/voters/verify — a signed-in resident checks themselves against the list.
exports.verifyMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Account not found." });

    const { lastName, firstName, middleName, birthdate, barangay } = req.body || {};
    const result = await verifyResidentAsVoter(
      user,
      { lastName, firstName, middleName, birthdate, barangay },
      req.app.get("io")
    );
    const httpStatus = { verified: 200, not_found: 404, claimed: 409, incomplete: 400, unavailable: 503 }[result.status] || 200;
    res.status(httpStatus).json({ ...result, residentVerificationStatus: user.residentVerificationStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
