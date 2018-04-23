const { FriendshipValidationError } = require('../../shared/errors');
const { Friendship } = require('../../database/models/friendship');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new FriendshipValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function validateFriendRequest(friendId, userId) {
  if (userId.toString() === friendId) {
    return Promise.reject(
      new FriendshipValidationError('You cannot follow yourself.')
    );
  }

  if (!friendId) {
    return Promise.reject(
      new FriendshipValidationError('Please provide the user ID of the friend you wish to follow.')
    );
  }

  return Friendship
    .find({
      _user: userId,
      _friend: friendId
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const friend = docs[0];

      if (friend) {
        return Promise.reject(
          new FriendshipValidationError('You are already following that person.')
        );
      }

      return new Friendship({
        _user: userId,
        _friend: friendId
      });
    });
}

module.exports = {
  handleError,
  validateFriendRequest
};
