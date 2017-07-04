const logger = require('winston');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const databaseUri = process.env.DATABASE_URI;

module.exports = {
  connect: () => {
    mongoose.connect(databaseUri, { useMongoClient: true })
      .then(() => logger.info(`Database connected at ${databaseUri}`))
      .catch(err => logger.error(`Database connection error: ${err.message}`));
  }
};
