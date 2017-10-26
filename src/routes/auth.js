const express = require('express');
const passport = require('passport');

const { User } = require('../database/models/user');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const register = [
  function checkSpamBot(req, res, next) {
    if (req.body.gdNickname) {
      const err = new Error('You are a spam bot. Goodbye!');
      err.status = 400;
      err.code = 108;
      next(err);
      return;
    }

    next();
  },

  function registerUser(req, res, next) {
    let user = new User({
      emailAddress: req.body.emailAddress,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateLastLoggedIn: new Date()
    });

    user
      .setPassword(req.body.password)
      .then(() => {
        user.resetEmailAddressVerification();
        return user.save();
      })
      .then(doc => {
        // TODO: Send verification email.
        // TODO: Send welcome email.
        res.json({
          id: doc._id,
          message: 'Registration successful! Please log in below.'
        });
      })
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

      authResponse({
        message: `Welcome, ${req.user.firstName}!`
      })(req, res, next);
    })(req, res, next);
  }
];

const forgotten = [
  function checkEmptyEmailAddress(req, res, next) {
    if (req.body.emailAddress) {
      next();
      return;
    }

    const error = new Error('Please provide an email address.');
    error.status = 400;
    error.code = 104;
    next(error);
  },

  function requestResetPasswordToken(req, res, next) {
    User
      .find({ emailAddress: req.body.emailAddress })
      .limit(1)
      .then((docs) => {
        const user = docs[0];

        if (!user) {
          const err = new Error(`The email address "${req.body.emailAddress}" was not found in our records.`);
          err.code = 104;
          err.status = 400;
          return Promise.reject(err);
        }

        user.setResetPasswordToken();
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
    if (!req.body.resetPasswordToken && !req.body.currentPassword) {
      const error = new Error('Please provide your current password.');
      error.status = 400;
      error.code = 107;
      next(error);
      return;
    }

    if (!req.body.password || !req.body.passwordAgain) {
      const error = new Error('Please provide a new password.');
      error.status = 400;
      error.code = 107;
      next(error);
      return;
    }

    if (req.body.password !== req.body.passwordAgain) {
      const error = new Error('The passwords you typed do not match.');
      error.status = 400;
      error.code = 105;
      next(error);
      return;
    }

    next();
  },

  function validateResetPasswordJwt(req, res, next) {
    if (req.headers.authorization) {
      authenticateJwt(req, res, next);
      return;
    }

    next();
  },

  function validateResetPasswordToken(req, res, next) {
    if (!req.body.resetPasswordToken) {
      // User passed the JWT authentication, check for current password.
      if (req.user) {
        req.user
          .validatePassword(req.body.currentPassword)
          .then(() => next())
          .catch(next);

        return;
      }

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

  function resetPassword(req, res, next) {
    const user = req.user;

    return user
      .setPassword(req.body.password)
      .then(() => {
        user.unsetResetPasswordToken();
        return user.save();
      })
      .then(() => authResponse({ message: 'Your password was successfully reset.' })(req, res, next))
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 107;
          err.message = 'Reset password validation failed.';
        }

        next(err);
      });
  }
];

const resendEmailAddressVerification = [
  authenticateJwt,

  function requestEmailAddressVerificationToken(req, res, next) {
    req.user.resetEmailAddressVerification();
    req.user
      .save()
      .then(() => {
        // TODO: Send email here...
        authResponse({
          message: `Verification email sent to ${req.user.emailAddress}. If the email does not appear within 15 minutes, check your spam folder.`
        })(req, res, next)
      })
      .catch(next);
  }
];

const verifyEmailAddress = [
  authenticateJwt,

  function checkEmailAddressVerificationToken(req, res, next) {
    const isVerified = req.user.verifyEmailAddress(req.body.emailAddressVerificationToken);

    if (isVerified) {
      req.user
        .save()
        .then(() => {
          authResponse({
            message: 'Email address verified!'
          })(req, res, next);
        })
        .catch(next);
      return;
    }

    const err = new Error('The email verification token is invalid or has expired.');
    err.status = 400;
    err.code = 109;
    next(err);
  }
];

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgotten', forgotten);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/resend-email-verification', resendEmailAddressVerification);
router.post('/auth/verify-email', verifyEmailAddress);

module.exports = {
  middleware: {
    register,
    login,
    forgotten,
    resetPassword,
    resendEmailAddressVerification,
    verifyEmailAddress
  },
  router
};
