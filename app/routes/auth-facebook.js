const passport = require('passport');

const authenticate = [
  passport.authenticate('facebook')
];

const callback = [
  passport.authenticate('facebook'),
  (req, res) => res.json({
    message: 'Logged in using Facebook.'
  })
];

module.exports = (router) => {
  router.get('/auth/facebook', authenticate);
  router.get('/auth/facebook/callback', callback);
};
