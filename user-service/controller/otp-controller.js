import crypto from "crypto";

import {
  findUserByEmail as _findUserByEmail,
  createOtp as _createOtp,
  findLatestOtpByEmail as _findLatestOtpByEmail,
  deleteOtpsByEmail as _deleteOtpsByEmail,
  verifyEmailById as _verifyEmailById,
} from "../model/repository.js";

import { sendOtpEmail } from "../utils/mailer.js";

/**
 * POST /auth/send-otp
 * Body: { email }
 *
 * Generates a 6-digit OTP and emails it to the supplied address.
 * The user account must already exist (registered) and must NOT yet be verified.
 */
export async function sendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await _findUserByEmail(email);
    if (!user) {
      // Return 200 for security – don't reveal whether the email is registered
      return res.status(200).json({ message: "If that email is registered, an OTP has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate a cryptographically random 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));

    await _createOtp(email, otp, "email_verification");
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: "OTP sent to your email address. It expires in 10 minutes." });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res.status(500).json({ message: "Failed to send OTP. Please try again later." });
  }
}

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 *
 * Verifies the OTP submitted by the user.
 * On success, marks the user's email as verified and removes stored OTPs.
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await _findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const storedOtp = await _findLatestOtpByEmail(email, "email_verification");
    if (!storedOtp) {
      return res.status(400).json({ message: "No OTP found for this email. Please request a new one." });
    }

    if (storedOtp.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark email as verified and clean up OTP records
    await _verifyEmailById(user.id);
    await _deleteOtpsByEmail(email, "email_verification");

    return res.status(200).json({ message: "Email verified successfully. You may now log in." });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Failed to verify OTP. Please try again later." });
  }
}
