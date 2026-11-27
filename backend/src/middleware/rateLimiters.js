const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// No custom keyGenerator here on purpose. "trust proxy" in app.js already makes
// req.ip the real client address behind Render, and the library's default key
// generator normalises IPv6 into subnets - a hand-rolled one that keys on the
// raw address lets an IPv6 client walk around the limit one address at a time.

const limitResponse = (message) => (req, res) =>
  res.status(429).json({ message });

/**
 * Account creation is the cheapest thing for an abuser to script: without a cap,
 * a single host can mint unlimited resident accounts and use them to file false
 * emergency reports. Kept generous enough that a household sharing one connection
 * during an actual emergency is never blocked.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse(
    "Too many accounts have been created from this connection. Please wait an hour, or contact the Alerto Calbayog administrator if this is urgent."
  ),
});

/**
 * Slows credential stuffing without locking out a resident who mistypes a password
 * a few times. Only failed attempts count against the limit.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse(
    "Too many failed sign-in attempts. Please wait 15 minutes before trying again."
  ),
});

/**
 * Every OTP request costs a real outbound email, so this doubles as abuse
 * protection and as protection for the Gmail account's daily sending quota.
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitResponse(
    "Too many verification codes requested. Please wait 15 minutes before requesting another."
  ),
});

// Keyed per signed-in account, so residents sharing one connection don't use up each other's limit.
const perUser = (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip));

/**
 * Sending a Voter's ID takes two upload signatures and one submission, so this
 * allows a few retakes and resends an hour while stopping a script from filling
 * the review queue or our Cloudinary storage.
 */
const voterIdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: perUser,
  handler: limitResponse("Too many Voter's ID requests. Please try again in an hour."),
});

/**
 * Each signature authorises one photo upload to our Cloudinary account. A report
 * carries up to five scene photos and more can be added after sending, so this is
 * far looser than the OTP limit it replaced on that route.
 */
const uploadSignatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: perUser,
  handler: limitResponse("Too many photo uploads. Please wait a few minutes and try again."),
});

module.exports = { registerLimiter, loginLimiter, otpLimiter, voterIdLimiter, uploadSignatureLimiter };
