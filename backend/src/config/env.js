require('dotenv').config();

// Fail fast: keys with no safe default must exist before the app does anything else.
// GOOGLE_CLIENT_ID is optional - omitting it disables Google OAuth but leaves
// username/password auth fully functional.
const REQUIRED_KEYS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'TMDB_API_KEY',
  'OMDB_API_KEY',
  'ANTHROPIC_API_KEY'
];

const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required env var(s): ${missing.join(', ')}`);
}

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  tmdbApiKey: process.env.TMDB_API_KEY,
  omdbApiKey: process.env.OMDB_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  aiCacheTtlVibeDays: Number(process.env.AI_CACHE_TTL_VIBE_DAYS) || 30,
  aiCacheTtlSummaryDays: Number(process.env.AI_CACHE_TTL_SUMMARY_DAYS) || 7
};

module.exports = env;
