const { AppError } = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.name, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'InternalServerError', message: 'Unexpected server error' });
}

module.exports = errorHandler;
