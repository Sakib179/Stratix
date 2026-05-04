const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const generateSecret = (email) => {
  return speakeasy.generateSecret({
    name: `${env.TOTP_ISSUER} (${email})`,
    issuer: env.TOTP_ISSUER,
    length: 32,
  });
};

const generateQRCode = async (otpauthUrl) => {
  return qrcode.toDataURL(otpauthUrl);
};

const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: token.replace(/\s/g, ''),
    window: 2,
  });
};

const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

const hashBackupCode = async (code) => {
  return bcrypt.hash(code, 10);
};

const verifyBackupCode = async (code, hashes) => {
  for (const { id, code_hash } of hashes) {
    const match = await bcrypt.compare(code.replace(/-/g, '').toUpperCase(), code_hash);
    if (match) return id;
  }
  return null;
};

module.exports = {
  generateSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
};
