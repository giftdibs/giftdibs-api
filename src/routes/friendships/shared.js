const {
  FriendshipValidationError
} = require('../../shared/errors');

function formatFriendshipResponse(friendship) {
  friendship.friend = { ...friendship._friend };
  friendship.friend.id = friendship.friend._id;
  friendship.user = { ...friendship._user };
  friendship.user.id = friendship.user._id;
  friendship.id = friendship._id;

  delete friendship._friend;
  delete friendship.friend._id;
  delete friendship._user;
  delete friendship.user._id;
  delete friendship._id;

  return friendship;
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
