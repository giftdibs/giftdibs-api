const authResponse = require('../../middleware/auth-response');
const { Friendship } = require('../../database/models/friendship');

function getFriendships(req, res, next) {
  const query = {};
  const userId = req.query.userId;

  if (userId) {
    query.$or = [{
      _user: userId
    }, {
      _friend: userId
    }];
  }

  Friendship
    .find(query)
    .populate('_friend', 'firstName lastName')
    .populate('_user', 'firstName lastName')
    .lean()
    .then((friendships) => {
      authResponse({
        friendships
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getFriendships
};
