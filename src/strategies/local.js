const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../database/models/user');

const strategyConfig = {
  usernameField: 'emailAddress'
};

const verify = (emailAddress, password, done) => {
  User
    .find({ emailAddress })
    .limit(1)
    .then(results => {
      const user = results[0];

      if (!user) {
        done(null, false, {
          message: 'A user with that email address was not found.'
        });
        return;
      }

      user
        .validateNewPassword(password)
        .then(() => {
          user.dateLastLoggedIn = new Date();
          user
            .save()
            .then(() => done(null, user));
        })
        .catch(() => {
          done(null, false, {
            message: [
              'The email address and password you entered',
              'did not match an account in our records.'
            ].join(' ')
          })
        });
    })
    .catch(err => done(err));
};

const strategy = new LocalStrategy(strategyConfig, verify);

module.exports = strategy;
