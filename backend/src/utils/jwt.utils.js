const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'stratix-bms',
  });
};

const generateRefreshTokenJWT = (payload) => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'stratix-bms',
  });
};

const generateTempToken = (payload) => {
  return jwt.sign(payload, env.TEMP_TOKEN_SECRET, {
    expiresIn: env.TEMP_TOKEN_EXPIRES_IN,
    issuer: 'stratix-bms',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: 'stratix-bms' });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET, { issuer: 'stratix-bms' });
};

const verifyTempToken = (token) => {
  return jwt.verify(token, env.TEMP_TOKEN_SECRET, { issuer: 'stratix-bms' });
};

module.exports = {
  generateAccessToken,
  generateRefreshTokenJWT,
  generateTempToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTempToken,
};
