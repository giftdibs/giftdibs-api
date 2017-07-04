if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  try {
    dotenv.config({ path: 'config.env' });
  } catch (e) {
    console.log('Environment configuration not found! Please provide a config.env file to continue.');
  }
}

module.exports = process.env;
