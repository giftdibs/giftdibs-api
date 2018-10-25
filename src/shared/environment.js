const firebaseFunctions = require('firebase-functions');
const path = require('path');

const applyEnvironment = () => {
  // Production environments should set their own values.
  if (process.env.NODE_ENV !== 'development') {
    console.log('Environment configuration is not parsed in production mode.');
    return;
  }

  const dotenv = require('dotenv');
  const cwd = process.cwd();
  const filePath = path.resolve(cwd, 'config.env');

  const result = dotenv.config({
    path: filePath
  });

  if (result.error) {
    console.warn(
      `Environment configuration could not be parsed from ${filePath}.`
    );
  } else {
    console.log(
      `Environment configuration parsed from ${filePath}.`
    );
  }
};

module.exports = {
  applyEnvironment,
  get: (key) => {
    let value = process.env[key];

    // Firebase only allows for lowercase environment variables.
    if (value === undefined) {
      value = firebaseFunctions.config().app[key.toLowerCase()];
    }

    return value;
  }
};
