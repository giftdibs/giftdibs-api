const logger = require('../shared/logger');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const databaseUri = process.env.DATABASE_URI;

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
