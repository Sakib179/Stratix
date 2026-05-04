const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}\n${err.stack}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details?.map((d) => d.message) || [err.message],
    });
  }

  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      message: 'Required field is missing',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : err.message || 'Internal server error';

  return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
