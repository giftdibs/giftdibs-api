const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../database/models/user');

const strategyConfig = {
  usernameField: 'emailAddress',
};

const verify = (emailAddress, password, done) => {
  User.find({ emailAddress })
    .limit(1)
    .then((results) => {
      const user = results[0];

      if (!user) {
        done(null, false, {
          message: 'user_not_found',
        });
        return;
      }

      // User has registered, but does not have a password.
      if (!user.password) {
        done(null, false, {
          message: 'empty_password',
        });
        return;
      }

      user
        .confirmPassword(password)
        .then(() => {
          user.dateLastLoggedIn = new Date();
          return user.save().then(() => done(null, user));
        })
        .catch(() => {
          done(null, false, {
            message: 'invalid_password',
          });
        });
    })
    .catch((err) => done(err));
};

const strategy = new LocalStrategy(strategyConfig, verify);

module.exports = strategy;
