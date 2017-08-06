const express = require('express');
const randomstring = require('randomstring');

const facebook = require('../lib/facebook');
const User = require('../database/models/user');
const authResponse = require('../middleware/auth-response');

function findUserByFacebookId(facebookId) {
  return User
    .find({ facebookId })
    .limit(1)
    .then((docs) => docs[0]);
}

function findUserByEmailAddress(facebookEmailAddress) {
  return User
    .find({ emailAddress: facebookEmailAddress })
    .limit(1)
    .then((docs) => docs[0]);
}

function updateOrCreateUserWithFacebookProfile(user, facebookProfile) {
  if (user) {
    user.emailAddressVerified = true;
    user.facebookId = facebookProfile.id;
    return user;
  }

  const newUser = new User({
    emailAddress: facebookProfile.email,
    emailAddressVerified: true,
    firstName: facebookProfile.first_name,
    lastName: facebookProfile.last_name,
    facebookId: facebookProfile.id
  });

  return newUser
    .setPassword(randomstring.generate())
    .then(() => newUser);
}

const loginFacebook = [
  (req, res, next) => {
    facebook
      .verifyUserAccessToken(req.body.facebookUserAccessToken)
      .then((fbResponse) => findUserByFacebookId(fbResponse.data.user_id))
      .then((user) => {
        if (user) {
          return user;
        }

        // Attempt to find or register a user with the Facebook profile information.
        return facebook
          .getProfile(req.body.facebookUserAccessToken)
          .then((profile) => {
            return findUserByEmailAddress(profile.email)
              .then((user) => updateOrCreateUserWithFacebookProfile(user, profile));
          });
      })
      .then((user) => {
        // TODO: Send welcome email if registering.
        user.dateLastLoggedIn = new Date();
        return user.save().then(() => user);
      })
      .then((user) => {
        req.user = user;
        authResponse({ message: `Welcome, ${req.user.firstName}!` })(req, res, next);
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 110;
          err.status = 400;
          err.message = 'Registration validation failed.';
        }

        next(err);
      });
  }
];

const router = express.Router();
router.post('/auth/login-facebook', loginFacebook);

module.exports = {
  middleware: {
    loginFacebook
  },
  router
};
