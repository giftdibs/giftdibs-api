const express = require('express');
const jwt = require('jsonwebtoken');

const facebook = require('../lib/facebook');
const User = require('../database/models/user');
const jwtResponse = require('../middleware/jwt-response');

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

const loginFacebook = [
  (req, res, next) => {
    let _facebookProfile;
    facebook.verifyUserAccessToken(req.body.accessToken)
      .then(() => findUserByFacebookId(req.body.facebookId))
      .then((user) => {
        if (user) {
          return user;
        }

        return facebook
          .getProfile(req.body.accessToken)
          .then((profile) => {
            _facebookProfile = profile;
            return findUserByEmailAddress(profile.email);
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

          return facebook.verifyUserAccessToken(decoded.facebookAccessToken);
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

const router = express.Router();
router.post('/auth/login-facebook', loginFacebook);
router.post('/auth/register-facebook', registerFacebook);

module.exports = {
  middleware: {
    loginFacebook,
    registerFacebook
  },
  router
};
