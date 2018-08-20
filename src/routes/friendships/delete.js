const authResponse = require('../../middleware/auth-response');

const {
  Friendship
} = require('../../database/models/friendship');

function deleteFriendship(req, res, next) {
  Friendship.confirmUserOwnership(req.params.friendshipId, req.user._id)
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
