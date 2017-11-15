const express = require('express');
const facebook = require('../lib/facebook');
const authenticateJwt = require('../middleware/authenticate-jwt');
const authResponse = require('../middleware/auth-response');

const {
  User
} = require('../database/models/user');

const {
  UserNotFoundError,
  UserValidationError
} = require('../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new UserValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function getSelectFields(req) {
  let selectFields;

  if (req.user._id.equals(req.params.userId)) {
    selectFields = [
      'facebookId',
      'firstName',
      'lastName',
      'emailAddress',
      'emailAddressVerified'
    ].join(' ');
  } else {
    selectFields = [
      'firstName',
      'lastName',
      'emailAddressVerified'
    ].join(' ');
  }

  return selectFields;
}

function updateWithFacebookProfile(user, reqBody) {
  if (!reqBody.facebookUserAccessToken) {
    return Promise.resolve(user);
  }

  return facebook
    .verifyUserAccessToken(reqBody.facebookUserAccessToken)
    .then(() => facebook.getProfile(reqBody.facebookUserAccessToken))
    .then((profile) => {
      user.firstName = profile.first_name;
      user.lastName = profile.last_name;
      user.emailAddress = profile.email;
      user.facebookId = profile.id;
      user.emailAddressVerified = true;

      return user;
    });
}

function getUser(req, res, next) {
  const selectFields = getSelectFields(req);

  User
    .find({ _id: req.params.userId })
    .limit(1)
    .select(selectFields)
    .lean()
    .then((docs) => {
      const user = docs[0];

      if (!user) {
        return Promise.reject(new UserNotFoundError());
      }

      authResponse({
        user
      })(req, res, next);
    })
    .catch(next);
}

function getUsers(req, res, next) {
  const selectFields = getSelectFields(req);

  User
    .find({})
    .select(selectFields)
    .lean()
    .then((users) => {
      authResponse({
        users
      })(req, res, next);
    })
    .catch(next);
}

function updateUser(req, res, next) {
  User
    .confirmOwnership(req.params.userId, req.user._id)
    .then((user) => updateWithFacebookProfile(user, req.body))
    .then((user) => {
      // Skip this step if user is updating their profile using Facebook.
      if (req.body.facebookUserAccessToken) {
        return user;
      }

      const emailAddress = req.body.emailAddress;

      // If the email address is being changed, need to re-verify.
      if (emailAddress && (user.emailAddress !== emailAddress)) {
        user.resetEmailAddressVerification();
      }

      return user.updateSync(req.body);
    })
    .then((user) => user.save())
    .then(() => {
      authResponse({
        message: 'User updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function deleteUser(req, res, next) {
  User
    .confirmOwnership(req.params.userId, req.user._id)
    .then(() => User.remove({ _id: req.params.userId }))
    .then(() => {
      // TODO: Remove wish lists, gifts, dibs, friendships owned by this user.
      res.json({
        message: 'Your account was successfully deleted. Goodbye!'
      });
    })
    .catch(next);
}

const router = express.Router();
router.use(authenticateJwt);
router.route('/users')
  .get(getUsers);
router.route('/users/:userId')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = {
  middleware: {
    getUser,
    getUsers,
    updateUser,
    deleteUser
  },
  router
};
