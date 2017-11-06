const {
  Friendship
} = require('../database/models/friendship');

const {
  FriendshipNotFoundError,
  FriendshipPermissionError
} = require('../shared/errors');

function confirmUserOwnsFriendship(req, res, next) {
  const friendshipId = req.params.friendshipId;

  if (friendshipId === undefined) {
    next(new FriendshipNotFoundError());
    return;
  }

  Friendship
    .find({ _id: friendshipId })
    .limit(1)
    .lean()
    .then((docs) => {
      const doc = docs[0];

      if (!doc) {
        return Promise.reject(new FriendshipNotFoundError());
      }

      if (req.user._id.toString() === doc._user.toString()) {
        next();
        return;
      }

      return Promise.reject(new FriendshipPermissionError());
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsFriendship
};
