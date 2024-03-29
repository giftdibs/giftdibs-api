const authResponse = require('../../middleware/auth-response');

const { User } = require('../../database/models/user');

const { UserNotFoundError } = require('../../shared/errors');

function getSelectFields(req) {
  let selectFields;

  if (req.user._id.toString() === req.params.userId) {
    selectFields = [
      'avatarUrl',
      // 'birthday',
      'facebookId',
      'firstName',
      'lastName',
      'emailAddress',
      'emailAddressVerified',
      'notificationSettings',
    ].join(' ');
  } else {
    selectFields = [
      'avatarUrl',
      'dateLastLoggedIn',
      'firstName',
      'lastName',
    ].join(' ');
  }

  return selectFields;
}

function getUser(req, res, next) {
  const selectFields = getSelectFields(req);

  User.find({ _id: req.params.userId })
    .limit(1)
    .select(selectFields)
    .lean()
    .then((docs) => {
      const user = docs[0];

      if (!user) {
        return Promise.reject(new UserNotFoundError());
      }

      user.id = user._id;
      delete user._id;

      authResponse({
        data: { user },
      })(req, res, next);
    })
    .catch(next);
}

function getUsers(req, res, next) {
  if (req.query.search) {
    const { searchUsers } = require('./search');
    searchUsers(req, res, next);
    return;
  }

  const selectFields = getSelectFields(req);

  User.find({})
    .select(selectFields)
    .sort('lastName')
    .lean()
    .then((users) => {
      users = users.map((user) => {
        user.id = user._id;
        delete user._id;
        return user;
      });
      authResponse({
        data: { users },
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getUser,
  getUsers,
};
