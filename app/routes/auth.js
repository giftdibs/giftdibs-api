// const User = require('../database/models/user');

const register = (req, res) => {
  res.json({});
  // let user = new User({
  //   emailAddress: req.body.emailAddress,
  //   firstName: req.body.firstName,
  //   lastName: req.body.lastName,
  //   dateCreated: new Date(),
  //   dateUpdated: new Date()
  // });

  // user
  //   .save()
  //   .then(doc => res.json(doc._id))
  //   .catch(res.send);
};

const login = (req, res) => {
  // 1. find user, then
  // req.login(user, function(err) {
  //   if (err) { return next(err); }
  //   return res.redirect('/users/' + req.user.username);
  // });
};

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
