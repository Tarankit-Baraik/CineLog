const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  await mongoose.connect(env.mongodbUri);
  return mongoose.connection;
}

module.exports = connectDB;
