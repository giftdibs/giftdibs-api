const authResponse = require('../../middleware/auth-response');

const { Friendship } = require('../../database/models/friendship');

const {
  FriendshipValidationError
} = require('../../shared/errors');

function formatFriendshipResponse(friendship) {
  friendship.friend = friendship._friend;
  friendship.user = friendship._user;
  delete friendship._friend;
  delete friendship._user;
  return friendship;
}

function getFriendships(req, res, next) {
  if (!req.query.userId) {
    next(new FriendshipValidationError(
      'Please provide a user ID.'
    ));
    return;
  }

  Friendship
    .getFriendshipsByUserId(req.query.userId)
    .then((friendships) => {
      authResponse({
        data: {
          friendships: friendships.map((friendship) => {
            return formatFriendshipResponse(friendship);
          })
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getFriendships
};
