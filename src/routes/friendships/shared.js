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

  return Friendship
    .find({
      _user: userId,
      _friend: friendId
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const friend = docs[0];

      if (!friend) {
        return;
      }

      const err = new FriendshipValidationError(
        'You are already following that person.'
      );

      return Promise.reject(err);
    });
}

module.exports = {
  handleError,
  validateFriendRequest
};
