const authResponse = require('../../middleware/auth-response');

const {
  Friendship
} = require('../../database/models/friendship');

function deleteFriendship(req, res, next) {
  const friendshipId = req.params.friendshipId;
  const userId = req.user._id;

  Friendship.confirmUserOwnership(friendshipId, userId)
    .then((friendship) => friendship.remove())
    .then(() => {
      authResponse({
        data: {},
        message: 'Friendship successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteFriendship
};
