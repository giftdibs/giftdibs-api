const express = require('express');
const passport = require('passport');

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

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);

module.exports = {
  middleware: {
    register,
    login
  },
  router
};
