const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { ValidationError, AuthenticationError, NotFoundError } = require('../utils/AppError');

const googleClient = new OAuth2Client(env.googleClientId);

// Student-project scope (blueprint §11): one short-lived token, no refresh-token system.
const TOKEN_TTL = '2h';

function issueToken(user) {
  return jwt.sign({ id: user._id.toString(), username: user.username }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) throw new ValidationError('username, email, password required');

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) throw new ValidationError('username or email already taken');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });

  res.status(201).json({ token: issueToken(user), user: { id: user._id, username: user.username, email: user.email } });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) throw new ValidationError('username, password required');

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AuthenticationError('Invalid credentials');
  }

  res.json({ token: issueToken(user), user: { id: user._id, username: user.username, email: user.email } });
}

async function me(req, res) {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) throw new NotFoundError('User no longer exists');
  res.json({ id: user._id, username: user.username, email: user.email, avatar: user.avatar, createdAt: user.createdAt });
}

async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) throw new ValidationError('Google credential required');

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new AuthenticationError('Invalid Google token');

  const { sub: googleId, email, name: username, picture: avatar } = payload;

  let user = await User.findOne({ email });
  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
  } else {
    // Determine unique username
    let finalUsername = username.replace(/\s+/g, '');
    let existing = await User.findOne({ username: finalUsername });
    let counter = 1;
    while (existing) {
      finalUsername = `${username.replace(/\s+/g, '')}${counter}`;
      existing = await User.findOne({ username: finalUsername });
      counter++;
    }
    user = await User.create({ username: finalUsername, email, googleId, avatar });
  }

  res.json({ token: issueToken(user), user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
}

module.exports = { register, login, me, googleLogin };
