import crypto from 'node:crypto';

/**
 * In-memory store for registration OTPs
 * Key: lowercase email string
 * Value: { hash, expiresAt, attempts, lastRequestedAt }
 */
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const COOLDOWN_MS = 30 * 1000;      // 30 seconds between requests
const MAX_ATTEMPTS = 5;

function cleanExpiredOtps() {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}

/**
 * Generates and securely stores a 6-digit OTP for the given email
 *
 * @param {string} email
 * @returns {{ success: boolean, otp?: string, error?: string, remainingCooldown?: number }}
 */
export function generateAndStoreOtp(email) {
  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Valid email is required' };
  }

  cleanExpiredOtps();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Rate limit: check cooldown
  if (existing && now - existing.lastRequestedAt < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - existing.lastRequestedAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSeconds}s before requesting a new code.`,
      remainingCooldown: remainingSeconds
    };
  }

  // Generate 6-digit cryptographically random numeric code (100000 to 999999)
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');

  otpStore.set(normalizedEmail, {
    hash,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastRequestedAt: now
  });

  return {
    success: true,
    otp,
    expiresAt: now + OTP_TTL_MS
  };
}

/**
 * Verifies the 6-digit OTP provided for an email address
 *
 * @param {string} email
 * @param {string} inputOtp
 * @param {boolean} [consume=true] - Whether to delete the OTP upon successful verification
 * @returns {boolean}
 */
export function verifyRegistrationOtp(email, inputOtp, consume = true) {
  if (!email || !inputOtp) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) return false;

  const now = Date.now();
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  const inputHash = crypto.createHash('sha256').update(String(inputOtp).trim()).digest('hex');
  const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.hash));

  if (isMatch && consume) {
    otpStore.delete(normalizedEmail);
  }

  return isMatch;
}

/**
 * Clears an OTP record
 */
export function clearOtp(email) {
  if (email) {
    otpStore.delete(email.toLowerCase().trim());
  }
}

export default {
  generateAndStoreOtp,
  verifyRegistrationOtp,
  clearOtp
};
