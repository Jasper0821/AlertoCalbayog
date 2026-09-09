/**
 * Single source of truth for the backend host.
 *
 * This used to be duplicated as a hardcoded fallback in four places, so moving the
 * API to a different host meant hunting them all down. Change the fallback here (or
 * better, set VITE_API_URL in the hosting provider's environment settings) and every
 * caller follows.
 */
const FALLBACK_API_HOST = "https://alertocalbayog-mcms.onrender.com";

/** Backend origin with no trailing slash and no /api suffix. Used for Socket.IO. */
export const API_HOST = String(import.meta.env.VITE_API_URL || FALLBACK_API_HOST)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

/** Backend REST base, i.e. the origin plus /api. */
export const API_BASE_URL = `${API_HOST}/api`;
