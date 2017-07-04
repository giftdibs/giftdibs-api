const express = require('express');
const passport = require('passport');

const User = require('../database/models/user');
const jwtResponse = require('../middleware/jwt-response');

const register = (req, res, next) => {
  let user = new User({
    emailAddress: req.body.emailAddress,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dateLastLoggedIn: new Date()
  });

  user.setPassword(req.body.password)
    .then(() => user.save())
    .then(doc => res.json({ id: doc._id }))
    .catch(next);
};

const login = [
  passport.authenticate('local', { session: false }),
  jwtResponse
];

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);

module.exports = router;
