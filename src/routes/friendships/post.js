const authResponse = require('../../middleware/auth-response');

const { Friendship } = require('../../database/models/friendship');

const { handleError } = require('./shared');

function createFriendship(req, res, next) {
  const friendId = req.body.friendId;
  const user = req.user;

  Friendship.create(friendId, user)
    .then((doc) => {
      authResponse({
        data: { friendshipId: doc._id },
        message: 'Friendship successfully created.',
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createFriendship,
};
