const { UPLOAD_FOLDERS } = require("./cloudinary");

/**
 * Evidence photos are accepted in two forms:
 *   - "https://res.cloudinary.com/<cloud>/..." — the current path, uploaded by the
 *     client straight to Cloudinary, so the report itself carries only a short URL.
 *   - "data:image/..."                        — the legacy inline path, kept as a
 *     fallback for when Cloudinary is unreachable, and because reports created
 *     before the migration still store their photos this way.
 *
 * Both render identically in an <img src>, so nothing downstream needs to care.
 */
const isCloudinaryUrl = (value) =>
  typeof value === "string" && /^https:\/\/res\.cloudinary\.com\/[\w-]+\//i.test(value);

const isInlineImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/");

const isValidEvidenceImage = (value) => isCloudinaryUrl(value) || isInlineImage(value);

/**
 * Validates a batch of evidence images.
 * Returns null when valid, or a human-readable error message.
 */
const validateEvidenceImages = (images, { min, max, label }) => {
  if (!Array.isArray(images)) {
    return `${label} must be provided as a list.`;
  }
  if (images.length < min || images.length > max) {
    return `${label}: submit between ${min} and ${max} images.`;
  }
  if (!images.every(isValidEvidenceImage)) {
    return `${label}: each image must be an uploaded photo URL or an inline image.`;
  }
  return null;
};

module.exports = {
  isCloudinaryUrl,
  isInlineImage,
  isValidEvidenceImage,
  validateEvidenceImages,
  UPLOAD_FOLDERS,
};
