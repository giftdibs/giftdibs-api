const authResponse = require('../../middleware/auth-response');

const {
  handleError,
  validateFriendRequest
} = require('./shared');

function createFriendship(req, res, next) {
  const friendId = req.body.friendId;
  const userId = req.user._id;

  validateFriendRequest(friendId, userId)
    .then((friendship) => friendship.save())
    .then((doc) => {
      authResponse({
        data: { friendshipId: doc._id },
        message: 'Friendship successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createFriendship
};
