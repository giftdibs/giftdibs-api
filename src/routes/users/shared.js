const {
  UserValidationError
} = require('../../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new UserValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  handleError
};
