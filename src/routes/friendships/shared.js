const {
  FriendshipValidationError
} = require('../../shared/errors');

function formatFriendshipResponse(friendship) {
  const clone = { ...friendship };

  clone.id = clone._id;
  delete clone._id;

  return clone;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new FriendshipValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatFriendshipResponse,
  handleError
};
