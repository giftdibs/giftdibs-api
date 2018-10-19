const logger = require('./logger');

const applyEnvironment = () => {
  // Production environments should set their own values.
  if (process.env.NODE_ENV === 'production') {
    logger.info('Environment configuration is not parsed in production mode.');
    return;
  }

  const dotenv = require('dotenv');
  const filePath = 'config.env';
  const result = dotenv.config({
    path: filePath
  });

  if (result.error) {
    logger.warn(
      `Environment configuration could not be parsed from ${filePath}.`
    );
  }
};

module.exports = {
  applyEnvironment
};
