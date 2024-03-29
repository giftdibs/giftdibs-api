const express = require('express');
const passport = require('passport');

const { User } = require('../database/models/user');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const {
  ResetPasswordTokenValidationError,
  ResetPasswordValidationError,
  EmailVerificationTokenValidationError,
  RegistrationValidationError,
  LoginNotFoundError,
  LoginValidationError,
  ForgottenPasswordValidationError,
} = require('../shared/errors');

const mailer = require('../shared/mailer');

function handleResetPasswordError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new ResetPasswordValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function updatePasswordForUser(user) {
  return (req, res, next) => {
    return user
      .setPassword(req.body.password)
      .then((user) => {
        user.unsetResetPasswordToken();
        return user.save();
      })
      .then(() => {
        authResponse({
          message: 'Your password was successfully reset.',
        })(req, res, next);
      });
  };
}

function getUserByResetPasswordToken(resetPasswordToken) {
  // Get a user with a non-expired reset token.
  return User.find({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  })
    .limit(1)
    .then((docs) => {
      const user = docs[0];

      if (!user) {
        return Promise.reject(new ResetPasswordTokenValidationError());
      }

      return user;
    });
}

const register = [
  function checkSpamBot(req, res, next) {
    if (req.body.gdNickname) {
      const error = new RegistrationValidationError();
      error.code = 108;
      next(error);
      return;
    }

    next();
  },

  function registerUser(req, res, next) {
    const user = new User({
      emailAddress: req.body.emailAddress,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      // birthday: req.body.birthday,
      dateLastLoggedIn: new Date(),
    });

    user
      .setPassword(req.body.password)
      .then(() => {
        user.resetEmailAddressVerification();
        return user.save();
      })
      .then((doc) => {
        return mailer
          .sendAccountVerificationEmail(
            doc.emailAddress,
            doc.emailAddressVerificationToken
          )
          .then(() => doc)
          .catch((err) => {
            // TODO: Log this to some logger service!
            console.log('Email error:', err);
            // Ignore email errors.
            return Promise.resolve(doc);
          });
      })
      .then((doc) => {
        return mailer.addUserToMailingList(doc).then(() => doc);
      })
      .then((doc) => {
        // TODO: Send welcome email.

        // Login new user.
        req.user = doc;
        authResponse({
          data: {
            userId: doc._id,
          },
          message: 'Registration successful!',
        })(req, res, next);
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          const error = new RegistrationValidationError();
          error.errors = err.errors;
          next(error);
          return;
        }

        next(err);
      });
  },
];

const login = [
  function checkEmptyCredentials(req, res, next) {
    if (req.body.emailAddress && req.body.password) {
      next();
      return;
    }

    const error = new LoginValidationError(
      'Please provide an email address and password.'
    );
    next(error);
  },

  function authenticate(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        next(err);
        return;
      }

      if (!user) {
        const error = new LoginNotFoundError();
        let code;
        let message;
        switch (info.message) {
          case 'invalid_password':
            code = 101;
            message = "The password you've entered is incorrect.";
            break;
          case 'empty_password':
            code = 112;
            message = [
              "The account associated with the email address you've",
              'entered does not have a password on record. This can',
              "occur when you've registered using your Facebook",
              'account, or if you have not logged into GiftDibs in',
              'several months.',
            ].join(' ');
            break;
          case 'user_not_found':
            code = 113;
            message = [
              "That email address you've entered does",
              'not match an account.',
            ].join(' ');
            break;
        }

        error.message = message;
        error.code = code;
        next(error);
        return;
      }

      // Add the found user record to the request to
      // allow other middlewares to access it.
      req.user = user;

      authResponse({
        message: `Welcome, ${req.user.firstName}!`,
      })(req, res, next);
    })(req, res, next);
  },
];

const forgotten = [
  function checkEmptyEmailAddress(req, res, next) {
    if (req.body.emailAddress) {
      next();
      return;
    }

    const error = new ForgottenPasswordValidationError(
      'Please provide an email address.'
    );
    next(error);
  },

  function requestResetPasswordToken(req, res, next) {
    User.find({ emailAddress: req.body.emailAddress })
      .limit(1)
      .then((docs) => {
        const user = docs[0];

        // TODO: Don't show this message to the end user
        // (for privacy considerations).
        // Instead, tell the user that "if" this email address is valid, a link
        // to reset their password was sent.
        if (!user) {
          const err = new Error(
            [
              `The email address "${req.body.emailAddress}"`,
              'was not found in our records.',
            ].join(' ')
          );
          err.code = 104;
          err.status = 400;
          return Promise.reject(err);
        }

        user.setResetPasswordToken();

        return user.save();
      })
      .then((user) => {
        return mailer.sendPasswordResetEmail(
          user.emailAddress,
          user.resetPasswordToken
        );
      })
      .then(() => {
        return res.json({
          message: [
            'Email sent. Please check your spam folder if it does not appear',
            'in your inbox within 15 minutes.',
          ].join(' '),
        });
      })
      .catch(next);
  },
];

const resetPassword = [
  function checkPasswordFields(req, res, next) {
    if (!req.body.resetPasswordToken && !req.body.currentPassword) {
      next(
        new ResetPasswordValidationError(
          'Please provide your current password.'
        )
      );
      return;
    }

    if (!req.body.password || !req.body.passwordAgain) {
      next(new ResetPasswordValidationError('Please provide a new password.'));
      return;
    }

    if (req.body.password !== req.body.passwordAgain) {
      next(
        new ResetPasswordValidationError(
          'The passwords you typed do not match.'
        )
      );
      return;
    }

    next();
  },

  function checkJwtNeeded(req, res, next) {
    if (req.body.resetPasswordToken) {
      next();
      return;
    }

    authenticateJwt(req, res, next);
  },

  function resetPassword(req, res, next) {
    if (req.body.resetPasswordToken) {
      getUserByResetPasswordToken(req.body.resetPasswordToken)
        .then((user) => {
          // Since the user used their email address to request a
          // reset password token, mark their email as verified.
          user.emailAddressVerified = true;
          return user;
        })
        .then((user) => updatePasswordForUser(user)(req, res, next))
        .catch((err) => handleResetPasswordError(err, next));
    } else {
      req.user
        .confirmPassword(req.body.currentPassword)
        .then((user) => {
          // Since the user used their email address to request a
          // reset password token, mark their email as verified.
          user.emailAddressVerified = true;
          return user;
        })
        .then((user) => updatePasswordForUser(user)(req, res, next))
        .catch((err) => handleResetPasswordError(err, next));
    }
  },
];

const resendEmailAddressVerification = [
  authenticateJwt,

  function requestEmailAddressVerificationToken(req, res, next) {
    req.user.resetEmailAddressVerification();
    req.user
      .save()
      .then(() => {
        return mailer.sendAccountVerificationEmail(
          req.user.emailAddress,
          req.user.emailAddressVerificationToken
        );
      })
      .then(() => {
        authResponse({
          message: [
            `Verification email sent to ${req.user.emailAddress}.`,
            'If the email does not appear within 15 minutes,',
            'check your spam folder.',
          ].join(' '),
        })(req, res, next);
      })
      .catch(next);
  },
];

const verifyEmailAddress = [
  authenticateJwt,

  function checkEmailAddressVerificationToken(req, res, next) {
    if (!req.body.emailAddressVerificationToken) {
      next(
        new EmailVerificationTokenValidationError(
          'Please provide an email address verification token.'
        )
      );
      return;
    }

    const isVerified = req.user.verifyEmailAddress(
      req.body.emailAddressVerificationToken
    );

    if (isVerified) {
      req.user
        .save()
        .then(() => {
          authResponse({
            message: 'Email address verified!',
          })(req, res, next);
        })
        .catch(next);
      return;
    }

    const error = new EmailVerificationTokenValidationError();
    next(error);
  },
];

const deleteAccount = [
  authenticateJwt,

  function deleteAccount(req, res, next) {
    const userId = req.body.userId;
    User.confirmUserOwnership(userId, req.user._id)
      .then((user) => user.confirmPassword(req.body.password))
      .then((user) => user.remove())
      .then(() => {
        res.json({
          message: 'Your account was successfully deleted. Goodbye!',
        });
      })
      .catch(next);
  },
];

const refreshToken = [
  authenticateJwt,

  (req, res, next) => {
    authResponse({
      message: 'Token refreshed successfully.',
    })(req, res, next);
  },
];

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgotten', forgotten);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/resend-email-verification', resendEmailAddressVerification);
router.post('/auth/verify-email', verifyEmailAddress);
router.post('/auth/delete-account', deleteAccount);
router.post('/auth/refresh-token', refreshToken);

module.exports = {
  middleware: {
    deleteAccount,
    forgotten,
    login,
    refreshToken,
    register,
    resendEmailAddressVerification,
    resetPassword,
    verifyEmailAddress,
  },
  router,
};
