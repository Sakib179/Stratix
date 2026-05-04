const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

const comparePassword = async (plaintext, hash) => {
  return bcrypt.compare(plaintext, hash);
};

const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
};

const getPasswordStrengthScore = (password) => {
  if (!password) return { score: 0, label: 'none' };

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  const labels = ['none', 'very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong', 'excellent', 'excellent'];
  return { score: Math.min(score, 8), label: labels[Math.min(score, 8)] };
};

const isPasswordInHistory = async (plaintext, historyHashes) => {
  for (const hash of historyHashes) {
    const match = await bcrypt.compare(plaintext, hash);
    if (match) return true;
  }
  return false;
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  getPasswordStrengthScore,
  isPasswordInHistory,
};
