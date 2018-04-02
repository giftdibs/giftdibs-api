const logger = require('winston');

module.exports = (err, req, res, next) => {
  const statusCode = err.status || 500;

  const result = {
    message: err.message,
    code: err.code || 0
  };

  result.errors = err.errors || [];

  // Do not pass 500 errors to the client!
  if (statusCode === 500) {
    result.message = 'Something bad happened.';
    logger.warn('[Internal Server Error]', err);
  }

  res.status(statusCode).json(result);
};
