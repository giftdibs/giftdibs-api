const express = require('express');
const request = require('request-promise');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const User = require('../database/models/user');
const jwtResponse = require('../middleware/jwt-response');
const confirmUserOwnership = require('../middleware/confirm-user-ownership');

function verifyFacebookUserAccessToken(userAccessToken) {
  // First, get an app access token.
  // https://developers.facebook.com/docs/facebook-login/access-tokens/
  const requestOptions = {
    method: 'GET',
    uri: 'https://graph.facebook.com/oauth/access_token',
    qs: {
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
      grant_type: 'client_credentials'
    },
    json: true
  };

  return request(requestOptions)
    .then((response) => {
      // Then, use the app access token to verify that the user access token and ID is valid.
      // https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
      return request({
        method: 'GET',
        uri: 'https://graph.facebook.com/debug_token',
        qs: {
          input_token: userAccessToken,
          access_token: response.access_token
        },
        json: true
      });
    });
  // .then((response) => {
  //   console.log('facebook verify token response:', response);
  //   if (response.data.user_id !== facebookId) {
  //     const err = new Error('Forbidden.');
  //     err.status = 403;
  //     err.code = 110;
  //     return Promise.reject(err);
  //   }
  // });
}

function getFacebookProfile(userAccessToken) {
  return request({
    method: 'GET',
    url: 'https://graph.facebook.com/me',
    qs: {
      fields: 'email,first_name,last_name',
      access_token: userAccessToken
    },
    json: true
  });
}

function findUserByFacebookId(facebookId) {
  return User
    .find({ facebookId })
    .limit(1)
    .then((docs) => docs[0]);
}

function findUserByFacebookEmailAddress(facebookEmailAddress) {
  return User
    .find({ emailAddress: facebookEmailAddress })
    .limit(1)
    .then((docs) => docs[0]);
}

const loginFacebook = [
  (req, res, next) => {
    let _facebookProfile;
    verifyFacebookUserAccessToken(req.body.accessToken)
      .then(() => findUserByFacebookId(req.body.facebookId))
      .then((user) => {
        if (user) {
          return user;
        }

        return getFacebookProfile(req.body.accessToken)
          .then((profile) => {
            _facebookProfile = profile;
            return findUserByFacebookEmailAddress(profile.email);
          })
          .then((user) => {
            if (user) {
              user.emailAddressVerified = true;
              user.facebookId = req.body.facebookId;
              return user;
            }

            const payload = {
              emailAddress: _facebookProfile.email,
              firstName: _facebookProfile.first_name,
              lastName: _facebookProfile.last_name,
              facebookId: req.body.facebookId,
              facebookAccessToken: req.body.accessToken
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            const err = new Error();
            err.code = 111;
            err.status = 401;
            err.message = JSON.stringify({ accessToken: token, emailAddress: payload.emailAddress });
            return Promise.reject(err);
          });
      })
      .then((user) => {
        user.dateLastLoggedIn = new Date();
        return user.save().then(() => user);
      })
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(next);
  },
  jwtResponse
];

const registerFacebook = [
  (req, res, next) => {
    const token = req.headers.authorization.split('JWT ')[1];

    if (!token) {
      const err = new Error('The access token is invalid.');
      err.code = 112;
      err.status = 400;
      next(err);
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'JsonWebTokenError') {
          err.code = 112;
          err.message = 'Your request to register with Facebook is no longer valid. Please try again.'
        }

        if (err.name === 'TokenExpiredError') {
          err.code = 113;
          err.message = 'You took too long to register with your Facebook account. Please try again.';
        }

        return next(err);
      }

      const user = new User({
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        emailAddress: decoded.emailAddress,
        facebookId: decoded.facebookId,
        emailAddressVerified: true,
        dateLastLoggedIn: new Date()
      });

      User
        .find({
          emailAddress: decoded.emailAddress,
          facebookId: decoded.facebookId
        })
        .limit(1)
        .then((docs) => {
          if (docs[0]) {
            res.json({
              message: 'A user already exists with that Facebook ID.'
            });
            return;
          }

          return verifyFacebookUserAccessToken(decoded.facebookAccessToken);
        })
        .then(() => user.setPassword(req.body.password))
        .then(() => user.save())
        .then(() => {
          req.user = user;
          // TODO: Send welcome email.
          next();
        })
        .catch(err => {
          if (err.name === 'ValidationError') {
            err.code = 114;
            err.message = 'Registration validation failed.';
          }

          next(err);
        });
    });
  },
  jwtResponse
];

const updateUserWithFacebookProfile = [
  passport.authenticate('jwt', { session: false }),
  confirmUserOwnership,
  (req, res, next) => {
    verifyFacebookUserAccessToken(req.body.facebookUserAccessToken)
      .then((response) => getFacebookProfile(req.body.facebookUserAccessToken))
      .then((profile) => {
        req.user.firstName = profile.first_name;
        req.user.lastName = profile.last_name;
        req.user.emailAddress = profile.email;
        req.user.facebookId = profile.id;
        req.user.emailAddressVerified = true;
        return req.user.save();
      })
      .then(() => res.json({ message: 'Profile updated successfully.' }))
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 115;
          err.message = 'User update validation failed.';
        }

        next(err);
      });
  }
];

const router = express.Router();
router.post('/auth/login-facebook', loginFacebook);
router.post('/auth/register-facebook', registerFacebook);
router.post('/auth/update-user-with-facebook/:userId', updateUserWithFacebookProfile);

module.exports = {
  middleware: {
    loginFacebook,
    registerFacebook,
    updateUserWithFacebookProfile
  },
  router
};
