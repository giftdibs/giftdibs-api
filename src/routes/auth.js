const express = require('express');
const passport = require('passport');
const randomstring = require('randomstring');

const User = require('../database/models/user');
const jwtResponse = require('../middleware/jwt-response');

const register = [
  (req, res, next) => {
    let user = new User({
      emailAddress: req.body.emailAddress,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateLastLoggedIn: new Date()
    });

    user.setPassword(req.body.password)
      .then(() => user.save())
      .then(doc => res.json({ id: doc._id }))
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 102;
          err.message = 'Registration validation failed.';
        }

        next(err);
      });
  }
];

const login = [
  function checkEmptyCredentials(req, res, next) {
    if (req.body.emailAddress && req.body.password) {
      next();
      return;
    }

    const error = new Error('Please provide an email address and password.');
    error.status = 400;
    error.code = 100;
    next(error);
  },
  function authenticate(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        next(err);
        return;
      }

      if (!user) {
        const error = new Error(info.message);
        error.status = 400;
        error.code = 101;
        next(error);
        return;
      }

      // Add the found user record to the request to 
      // allow other middlewares to access it.
      req.user = user;

      next();
    })(req, res, next);
  },
  jwtResponse
];

const forgotten = [
  (req, res, next) => {
    User
      .find({ emailAddress: req.body.emailAddress })
      .limit(1)
      .then(docs => {
        const user = docs[0];

        if (!user) {
          const err = new Error(`The email address, "${req.body.emailAddress}", was not found in our records.`);
          err.code = 104;
          err.status = 400;
          return Promise.reject(err);
        }

        user.resetPasswordToken = randomstring.generate();
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        // TODO: Remove this after implementing email service.
        console.log('reset password token:', user.resetPasswordToken);

        return user.save();
      })
      .then(() => {
        // TODO: Send an email, here.

        return res.json({
          message: 'Email sent. Please check your spam folder if it does not appear in your inbox within 15 minutes.'
        });
      })
      .catch(next);
  }
];

const resetPassword = [
  function validatePassword(req, res, next) {
    if (!req.body.password || !req.body.passwordAgain) {
      const error = new Error('Please provide a new password.');
      error.status = 400;
      error.code = 105;
      next(error);
      return;
    }

    if (req.body.password !== req.body.passwordAgain) {
      next(new Error('The passwords you typed do not match.'));
      return;
    }

    next();
  },
  function validateResetPasswordJwt(req, res, next) {
    if (req.headers.authorization) {
      passport.authenticate('jwt', { session: false })(req, res, next);
      return;
    }

    next();
  },
  function validateResetPasswordToken(req, res, next) {
    // User passed the JWT authentication, skip this step.
    if (req.user) {
      next();
      return;
    }

    if (!req.body.resetPasswordToken) {
      const error = new Error('The reset password token is invalid.');
      error.status = 400;
      error.code = 106;
      next(error);
      return;
    }

    User
      .find({
        resetPasswordToken: req.body.resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      })
      .limit(1)
      .then(docs => {
        const user = docs[0];

        if (!user) {
          const error = new Error('The reset password token is invalid.');
          error.status = 400;
          error.code = 106;
          return Promise.reject(error);
        }

        req.user = user;
        next();
      })
      .catch(next);
  },
  function setPassword(req, res, next) {
    const user = req.user;
    return user
      .setPassword(req.body.password)
      .then(() => {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        return user.save();
      })
      .then(() => res.json({ message: 'Your password was successfully reset.' }))
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 107;
          err.message = 'Reset password validation failed.';
        }

        next(err);
      });
  }
];

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgotten', forgotten);
router.post('/auth/reset-password', resetPassword);

module.exports = {
  middleware: {
    register,
    login,
    forgotten,
    resetPassword
  },
  router
};
