const express = require('express');
const facebook = require('../lib/facebook');
const authenticateJwt = require('../middleware/authenticate-jwt');
const confirmUserOwnership = require('../middleware/confirm-user-owns-user');
const authResponse = require('../middleware/auth-response');
const { User } = require('../database/models/user');

const {
  UserNotFoundError,
  UserValidationError
} = require('../shared/errors');

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

const getUser = [
  (req, res, next) => {
    const selectFields = getSelectFields(req);

    User
      .find({ _id: req.params.userId })
      .limit(1)
      .select(selectFields)
      .lean()
      .then(docs => {
        const user = docs[0];

        if (!user) {
          return Promise.reject(new UserNotFoundError());
        }

        authResponse(user)(req, res, next);
      })
      .catch(next);
  }
];

const getUsers = [
  (req, res, next) => {
    const selectFields = getSelectFields(req);

    User
      .find({})
      .select(selectFields)
      .lean()
      .then(docs => authResponse(docs)(req, res, next))
      .catch(next);
  }
]

const updateUser = [
  confirmUserOwnership,

  function updateWithFacebookProfile(req, res, next) {
    if (!req.body.facebookUserAccessToken) {
      next();
      return;
    }

    facebook
      .verifyUserAccessToken(req.body.facebookUserAccessToken)
      .then(() => facebook.getProfile(req.body.facebookUserAccessToken))
      .then((profile) => {
        const user = req.user;
        user.firstName = profile.first_name;
        user.lastName = profile.last_name;
        user.emailAddress = profile.email;
        user.facebookId = profile.id;
        user.emailAddressVerified = true;
        next();
      });
  },

  function updateWithFormData(req, res, next) {
    if (req.body.facebookUserAccessToken) {
      next();
      return;
    }

    const user = req.user;
    const emailAddress = req.body.emailAddress;

    // If the email address is being changed, need to re-verify.
    if (emailAddress && (user.emailAddress !== emailAddress)) {
      user.resetEmailAddressVerification();
    }

    user.update(req.body);

    next();
  },

  function saveUser(req, res, next) {
    req.user
      .save()
      .then(() => {
        authResponse({ message: 'User updated.' })(req, res, next);
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          const error = new UserValidationError();
          error.errors = err.errors;
          next(error);
          return;
        }

        next(err);
      });
  }
];

const deleteUser = [
  confirmUserOwnership,
  (req, res, next) => {
    User
      .remove({ _id: req.params.userId })
      .then(() => {
        return res.json({
          message: 'Your account was successfully deleted. Goodbye!'
        });
      })
      .catch(next);
  }
];

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
