const dotenv = require('dotenv');
const logger = require('winston');

const getEnvironment = (filePath = 'config.env') => {  
  const result = dotenv.config({ path: filePath });

  if (result.error) {
    logger.info(`Environment configuration could not be parsed from ${filePath}.`);
  }

  return process.env;
};

module.exports = getEnvironment;
