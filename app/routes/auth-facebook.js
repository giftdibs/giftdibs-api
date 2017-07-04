const passport = require('passport');

const authenticate = [
  passport.authenticate('facebook', { session: false })
];

const callback = [
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    res.json({
      message: 'Logged in using Facebook.'
    });
  }
];

module.exports = (router) => {
  router.get('/auth/facebook', authenticate);
  router.get('/auth/facebook/callback', callback);
};
