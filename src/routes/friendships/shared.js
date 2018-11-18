const {
  FriendshipValidationError
} = require('../../shared/errors');

function formatFriendshipResponse(friendship) {
  const clone = { ...friendship };

  clone.id = clone._id;
  clone.friendId = clone._friend;
  clone.userId = clone._user;

  delete clone._id;
  delete clone._friend;
  delete clone._user;

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
