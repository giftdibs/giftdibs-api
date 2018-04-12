const authResponse = require('../../middleware/auth-response');
const { Friendship } = require('../../database/models/friendship');

const {
  handleError,
  validateFriendRequest
} = require('./shared');

function createFriendship(req, res, next) {
  validateFriendRequest(req.body._friend, req.user._id)
    .then(() => {
      const friendship = new Friendship({
        _user: req.user._id,
        _friend: req.body._friend
      });

      return friendship.save();
    })
    .then((friendship) => {
      authResponse({
        data: { friendshipId: friendship._id },
        message: 'Friendship successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createFriendship
};
