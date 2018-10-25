const mongoose = require('mongoose');

const env = require('../shared/environment');
const logger = require('../shared/logger');

mongoose.Promise = Promise;

const databaseUri = env.get('DATABASE_URI');

module.exports = {
  connect: () => {
    return mongoose
      .connect(databaseUri)
      .then(() => {
        logger.info(`Database connected at ${databaseUri}`);
      })
      .catch((err) => {
        logger.error(`Database connection error: ${err.message}`);
      });
  },
  disconnect: () => {
    mongoose.disconnect();
  }
};
