const mongoose = require('mongoose');

const env = require('../shared/environment');
const logger = require('../shared/logger');

mongoose.Promise = Promise;

// Suppresses console warning.
// See: https://github.com/Automattic/mongoose/issues/6890
mongoose.set('useCreateIndex', true);

const databaseUri = env.get('DATABASE_URI');

module.exports = {
  connect: () => {
    return mongoose.connect(databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
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
