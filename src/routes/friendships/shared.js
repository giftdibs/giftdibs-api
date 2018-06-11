const { FriendshipValidationError } = require('../../shared/errors');
const { Friendship } = require('../../database/models/friendship');

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

function validateFriendRequest(friendId, userId) {
  if (userId.toString() === friendId) {
    return Promise.reject(
      new FriendshipValidationError('You cannot follow yourself.')
    );
  }

  if (!friendId) {
    return Promise.reject(
      new FriendshipValidationError(
        'Please provide the user ID of the friend you wish to follow.'
      )
    );
  }

  // TODO: Prevent non-verified accounts from following people!

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
  formatFriendshipResponse,
  handleError,
  validateFriendRequest
};
