const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../database/models/user');

const register = (req, res, next) => {
  let user = new User({
    emailAddress: req.body.emailAddress,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dateCreated: new Date(),
    dateUpdated: new Date()
  });

  user.setPassword(req.body.password)
    .then(() => user.save())
    .then(doc => res.json({ id: doc._id }))
    .catch(next);
};

const login = [
  passport.authenticate('local', { session: false }),
  (req, res, next) => {
    const payload = { id: req.user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.json({ token });
  }
];

const logout = (req, res) => {
  req.logout();
  res.json({
    message: 'Logged out.'
  });
};

module.exports = (router) => {
  router.post('/auth/register', register);
  router.post('/auth/login', login);
  router.post('/auth/logout', logout);
};
