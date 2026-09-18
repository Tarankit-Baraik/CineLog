const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AuthenticationError } = require('../utils/AppError');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing bearer token');
  }

  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret);
    next();
  } catch {
    throw new AuthenticationError('Invalid or expired token');
  }
}

module.exports = authMiddleware;
