require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optional = (key, defaultValue) => process.env[key] || defaultValue;

module.exports = {
  PORT: parseInt(optional('PORT', '5000')),
  NODE_ENV: optional('NODE_ENV', 'development'),

  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optional('DB_PORT', '5432')),
  DB_NAME: optional('DB_NAME', 'stratix_db'),
  DB_USER: optional('DB_USER', 'postgres'),
  DB_PASSWORD: optional('DB_PASSWORD', ''),

  ACCESS_TOKEN_SECRET: optional('ACCESS_TOKEN_SECRET', 'dev_access_secret_change_in_prod'),
  REFRESH_TOKEN_SECRET: optional('REFRESH_TOKEN_SECRET', 'dev_refresh_secret_change_in_prod'),
  TEMP_TOKEN_SECRET: optional('TEMP_TOKEN_SECRET', 'dev_temp_secret_change_in_prod'),
  ACCESS_TOKEN_EXPIRES_IN: optional('ACCESS_TOKEN_EXPIRES_IN', '15m'),
  REFRESH_TOKEN_EXPIRES_IN: optional('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  TEMP_TOKEN_EXPIRES_IN: optional('TEMP_TOKEN_EXPIRES_IN', '5m'),

  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587')),
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASS: optional('SMTP_PASS', ''),
  EMAIL_FROM: optional('EMAIL_FROM', 'noreply@stratix.com'),

  COMPANY_NAME: optional('COMPANY_NAME', 'Stratix'),
  COMPANY_ADDRESS: optional('COMPANY_ADDRESS', ''),
  COMPANY_LOGO_URL: optional('COMPANY_LOGO_URL', ''),

  UPLOAD_DIR: optional('UPLOAD_DIR', 'uploads'),
  MAX_FILE_SIZE_MB: parseInt(optional('MAX_FILE_SIZE_MB', '5')),
  MAX_PRODUCT_IMAGE_MB: parseInt(optional('MAX_PRODUCT_IMAGE_MB', '2')),

  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:3000'),
  API_BASE_URL: optional('API_BASE_URL', 'http://localhost:5000'),
  TOTP_ISSUER: optional('TOTP_ISSUER', 'Stratix BMS'),
  DEFAULT_TAX_RATE: parseFloat(optional('DEFAULT_TAX_RATE', '0')),

  GOOGLE_CLIENT_ID:     optional('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET', ''),
  FACEBOOK_APP_ID:      optional('FACEBOOK_APP_ID', ''),
  FACEBOOK_APP_SECRET:  optional('FACEBOOK_APP_SECRET', ''),
  LINKEDIN_CLIENT_ID:   optional('LINKEDIN_CLIENT_ID', ''),
  LINKEDIN_CLIENT_SECRET: optional('LINKEDIN_CLIENT_SECRET', ''),
};
