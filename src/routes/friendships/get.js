const authResponse = require('../../middleware/auth-response');

const { Friendship } = require('../../database/models/friendship');

const {
  FriendshipValidationError
} = require('../../shared/errors');

const { formatFriendshipResponse } = require('./shared');

function getFriendships(req, res, next) {
  if (!req.query.userId) {
    next(new FriendshipValidationError(
      'Please provide a user ID.'
    ));
    return;
  }

  Friendship.getFriendshipsByUserId(req.query.userId)
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
