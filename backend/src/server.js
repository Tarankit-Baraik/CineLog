const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`CineLog backend listening on port ${env.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
