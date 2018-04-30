const dotenv = require('dotenv');
const logger = require('winston');

const applyEnvironment = () => {
  // Production environments should set their own values.
  if (process.env.NODE_ENV === 'production') {
    return;
  }

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
