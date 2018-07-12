const {
  MessageValidationError
} = require('../../shared/errors');

function formatMessageResponse(message, userId) {
  const clone = { ...message };

  clone.user = { ...clone._user };
  clone.user.id = clone.user._id;
  clone.id = clone._id;

  delete clone._user;
  delete clone.user._id;
  delete clone._id;

  return clone;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new MessageValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatMessageResponse,
  handleError
};
