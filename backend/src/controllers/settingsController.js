const SystemSettings = require("../models/SystemSettings");

const DEFAULT_SETTINGS = {
  backupConfig: { interval: "weekly", retention: "12" },
  locationConfig: { refreshRate: 10, lat: "12.0674", lng: "124.5946", provider: "osm", zoom: 13 },
  securityConfig: { complexPassword: true, sessionTimeout: 60 },
  notificationsConfig: { soundAlerts: true, desktopNotif: true, smsAlerts: false, residentPush: true, radius: "5" },
  activeCategories: { fire: true, flood: true, crime: true, medical: true, others: true },
  customAgencies: ["BFP", "CDRRMO", "PNP"]
};

/**
 * Utility: get a single setting value from the database.
 * Falls back to the hardcoded default if not stored yet.
 * Can be imported by other controllers:
 *   const { getSettingValue } = require("./settingsController");
 */
exports.getSettingValue = async (key) => {
  try {
    const doc = await SystemSettings.findOne({ key }).lean();
    if (doc && doc.value !== undefined) return doc.value;
  } catch (_) { /* swallow, return default */ }
  return DEFAULT_SETTINGS[key] ?? null;
};

exports.getSettings = async (req, res) => {
  try {
    const settingsList = await SystemSettings.find({});
    const settingsMap = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const merged = {
      backupConfig: settingsMap.backupConfig || DEFAULT_SETTINGS.backupConfig,
      locationConfig: settingsMap.locationConfig || DEFAULT_SETTINGS.locationConfig,
      securityConfig: settingsMap.securityConfig || DEFAULT_SETTINGS.securityConfig,
      notificationsConfig: settingsMap.notificationsConfig || DEFAULT_SETTINGS.notificationsConfig,
      activeCategories: settingsMap.activeCategories || DEFAULT_SETTINGS.activeCategories,
      customAgencies: settingsMap.customAgencies || DEFAULT_SETTINGS.customAgencies,
    };

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings", error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ message: "Settings key is required" });
    }

    const updated = await SystemSettings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.json({ message: `Settings for ${key} updated successfully`, data: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};
