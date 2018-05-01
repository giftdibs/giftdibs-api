const authResponse = require('../../middleware/auth-response');

const { Friendship } = require('../../database/models/friendship');

function formatFriendshipResponse(friendship) {
  friendship.friend = friendship._friend;
  friendship.user = friendship._user;
  delete friendship._friend;
  delete friendship._user;
  return friendship;
}

function getFriendships(req, res, next) {
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
