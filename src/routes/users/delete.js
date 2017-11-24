const {
  User
} = require('../../database/models/user');

function deleteUser(req, res, next) {
  User
    .confirmUserOwnership(req.params.userId, req.user._id)
    .then((user) => user.remove())
    .then(() => {
      // TODO: Remove wish lists, gifts, dibs, friendships owned by this user.
      res.json({
        message: 'Your account was successfully deleted. Goodbye!'
      });
    })
    .catch(next);
}

module.exports = {
  deleteUser
};
