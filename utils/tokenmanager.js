import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// SECURITY CHECK
// ============================================================
if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: Missing JWT_SECRET in environment variables.");
}

// ============================================================
// CREATE EMAIL VERIFICATION TOKEN (24 HOURS)
// ============================================================
export const createVerificationToken = (email) => {
  try {
    return jwt.sign(
      { email },
      process.env.JWT_SECRET || "TEMP_SECRET_KEY",   // fallback protection
      { expiresIn: "24h" }
    );
  } catch (err) {
    console.error("❌ Error creating verification token:", err.message);
    return null;
  }
};

// ============================================================
// VERIFY EMAIL TOKEN
// ============================================================
export const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "TEMP_SECRET_KEY"   // fallback protection
    );
  } catch (err) {
    console.warn("⚠️ Verification failed:", err.message);
    return null;
  }
};
