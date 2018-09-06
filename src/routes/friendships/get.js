const authResponse = require('../../middleware/auth-response');

const { Friendship } = require('../../database/models/friendship');

const {
  FriendshipValidationError
} = require('../../shared/errors');

const {
  formatFriendshipResponse
} = require('./shared');

function getFriendships(req, res, next) {
  const userId = req.params.userId;

  if (!userId) {
    next(new FriendshipValidationError(
      'Please provide a user ID.'
    ));
    return;
  }

  Friendship.getFriendshipsByUserId(userId)
    .then((friendships) => {
      friendships.following =
        friendships.following.map(formatFriendshipResponse);
      friendships.followers =
        friendships.followers.map(formatFriendshipResponse);
      return friendships;
    })
    .then((friendships) => {
      authResponse({
        data: { friendships }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getFriendships
};
